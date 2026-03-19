require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

const [major] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade your node.js version at least 20 or greater.');
  process.exit();
}

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ FATAL ERROR: DATABASE environment variable is missing!');
  console.error('Please add DATABASE or DATABASE_URL in your Railway Variables tab.');
  process.exit(1);
}

mongoose.connect(databaseUrl, { dbName: 'BizCollab_core' });

mongoose.connection.on('error', (error) => {
  console.error(`MongoDB connection error: ${error.message}`);
});

const coreModelsFiles = globSync('./src/models/coreModels/**/*.js');

for (const filePath of coreModelsFiles) {
  require(path.resolve(filePath));
}

const { initRedis } = require('./setup/redis');
const app = require('./app');
// Set the port
const port = process.env.PORT || 8888;
app.set('port', port);

// Start the Express server immediately to prevent 502 Bad Gateway on Railway
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[System] Express running on PORT: ${server.address().port}`);
  console.log(`[System] Host: 0.0.0.0 (Railway optimized)`);
});

// Initialize Redis in the background
initRedis().catch(err => {
  console.error('[System] Redis init failed (background):', err.message);
});

// Global Error Handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  // Optional: Graceful shutdown if error is critical
});

  const io = require('socket.io')(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "https://*.railway.app"] : true) 
      : ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});

const jwt = require('jsonwebtoken');

// Socket.io Middleware for Authentication & Multi-Tenancy
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
  
  if (!token) {
    console.warn(`[Socket] Connection attempt denied: No token. ID: ${socket.id}`);
    return next(new Error('Authentication error: No token provided'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.warn(`[Socket] Connection attempt denied: Invalid token. ID: ${socket.id}`);
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.tenantId = decoded.tenantId;
    socket.userId = decoded.id;
    next();
  });
});

io.on('connection', (socket) => {
  const roomName = `room:${socket.tenantId}`;
  socket.join(roomName);
  console.log(`Socket [${socket.id}] authenticated and joined room: ${roomName}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket [${socket.id}] disconnected`);
  });
});

app.set('io', io);

// MongoDB Change Streams with Multi-Tenant Isolation
mongoose.connection.once('open', () => {
  const invoiceSchema = require('@/models/schemas/Invoice');
  const Invoice = mongoose.model('Invoice', invoiceSchema);
  
  // Watch with fullDocument lookup to ensure we have the tenantId on update events
  const changeStream = Invoice.watch([], { fullDocument: 'updateLookup' });
  
  changeStream.on('change', (change) => {
    const fullDoc = change.fullDocument || {};
    const tenantId = fullDoc.tenantId;
    
    if (tenantId) {
      const roomName = `room:${tenantId}`;
      console.log(`[Socket] Scoped change detected for tenant ${tenantId}. Emitting to ${roomName}`);
      
      io.to(roomName).emit('invoice_change', {
        type: change.operationType,
        id: change.documentKey._id,
        status: fullDoc.status, // Defensive: Provide context
        total: fullDoc.total,   // Defensive: Provide context
      });
    } else {
      console.warn(`[Socket] Change Stream event received without tenantId. Scoping failed. Op: ${change.operationType}`);
    }
  });
});

// No closure needed here anymore
