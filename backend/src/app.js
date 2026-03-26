const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandlers = require('./handlers/errorHandlers');

// Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const erpApiRouter = require('./routes/appRoutes/appApi');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');

const authMiddleware = require('./middlewares/authMiddleware');
const tenantMiddleware = require('./middlewares/tenantMiddleware');

const env = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const isProduction = env === 'production';

// Initialize app
const app = express();

// Log for debugging Railway issues
// Serve Frontend in Production
const staticPath = isProduction 
  ? path.join(__dirname, '../public') 
  : path.join(__dirname, './public');

console.log(`[System] Initializing in ${env} mode`);
console.log(`[System] Static path: ${staticPath}`);


// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images/files
  contentSecurityPolicy: false,     // Disable CSP if it interferes with Next.js in dev
}));
app.use(morgan(isProduction ? 'combined' : 'dev'));
app.use(cors({ 
  origin: true, 
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());


// Nodemon restart trigger

const authController = require('./controllers/authController');

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Mount Routes
app.use('/api', authRoutes); // Handles /login, /register, /setup
app.use('/auth', authRoutes);
// app.use('/api/client', authMiddleware, tenantMiddleware, clientRoutes);

const publicDownloadPdf = require('./handlers/downloadHandler/publicDownloadPdf');

// Public PDF Download (for sharing)
app.get('/public/pdf/:tenantId/:directory/:id', publicDownloadPdf);

const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');

// Core API (Admin, Settings)
app.use('/api', authMiddleware, tenantMiddleware, coreApiRouter);

// ERP API (Quotes, Invoices, etc.)
app.use('/api', authMiddleware, tenantMiddleware, erpApiRouter);

app.use('/download', authMiddleware, tenantMiddleware, coreDownloadRouter);

app.use('/public', corePublicRouter);

// Serve Frontend in Production
if (isProduction) {
  app.use(express.static(staticPath));
  
  // Improved catch-all: Only serve index.html for non-API/non-public/non-assets routes
  app.get(/^(?!\/api|\/auth|\/public|\/assets).*/, (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}


// Error Handling
app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

module.exports = app;
