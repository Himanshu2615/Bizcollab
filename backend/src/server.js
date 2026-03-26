require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');
const jwt = require('jsonwebtoken');

const [major] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  console.log('Please upgrade your node.js version at least 20 or greater.');
  process.exit();
}

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '../.env' }); // Look in parent for monorepo root config
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '../.env.local' });


const databaseUrl = process.env.DATABASE || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ FATAL ERROR: DATABASE environment variable is missing!');
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
const port = process.env.PORT || 8888;
app.set('port', port);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`[System] Express running on PORT: ${server.address().port}`);
});

initRedis().catch(err => {
  console.error('[System] Redis init failed:', err.message);
});

// Real-time Service Integration
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ["http://localhost:3000", "http://localhost:5173", "https://*.railway.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling']
});


// Store watchers for cleanup
let watchers = [];

/**
 * Robust Change Stream Listener for Multi-Tenancy
 */
const initWatchers = (io) => {
  const modelsToWatch = [
    { name: 'Invoice', schema: '@/models/schemas/Invoice' },
    { name: 'Payment', schema: '@/models/schemas/Payment' },
    { name: 'Client', schema: '@/models/schemas/Client' }
  ];

  modelsToWatch.forEach(({ name, schema }) => {
    try {
      const Model = mongoose.models[name] || mongoose.model(name, require(schema));
      const watcher = Model.watch([], { fullDocument: 'updateLookup' });

      watcher.on('change', (change) => {
        const fullDoc = change.fullDocument || {};
        // Support both old and new tenantId paths
        const tenantId = fullDoc.tenantId || (change.updateDescription?.updatedFields?.tenantId);
        
        if (tenantId) {
          console.log(`[RealTime] ${name} changed for tenant ${tenantId}. Refreshing dashboard.`);
          io.to(`room:${tenantId}`).emit('dashboard:refresh', { source: name });
        } else {
          // If tenantId is not in change doc, emit to a global room if admin or log error
          console.warn(`[RealTime] Change in ${name} but no tenantId found.`);
        }
      });

      watcher.on('error', (err) => {
        console.error(`[RealTime] ${name} watcher error:`, err.message);
      });

      watchers.push(watcher);
    } catch (err) {
      console.error(`[RealTime] Failed to start watcher for ${name}:`, err.message);
    }
  });
};

io.on('connection', (socket) => {
  socket.on('join:dashboard', ({ tenantId }) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
      if (!token) return socket.disconnect(true);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (String(decoded.tenantId) === String(tenantId)) {
        socket.join(`room:${tenantId}`);
        console.log(`[Socket] Auth Success: Tenant ${tenantId} joined real-time room.`);
      } else {
        console.error(`[Socket] Auth Failed: Tenant mismatch.`);
        socket.disconnect(true);
      }
    } catch (err) {
      console.error(`[Socket] Auth Failed: ${err.message}`);
      socket.disconnect(true);
    }
  });
});

app.set('io', io);

// Pre-load schemas to ensure models are ready
require('@/models/schemas/Invoice');
require('@/models/schemas/Payment');
require('@/models/schemas/Client');

// Initialize
initWatchers(io);

const shutdown = () => {
  watchers.forEach(w => w.close());
  server.close(() => process.exit(0));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
