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

// Initialize app
const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images/files
  contentSecurityPolicy: false,     // Disable CSP if it interferes with Next.js in dev
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' ? true : true, // Set to true to allow all if needed, or specific domain
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

// Core API (Admin, Settings)
app.use('/api', authMiddleware, tenantMiddleware, coreApiRouter);

// ERP API (Quotes, Invoices, etc.)
app.use('/api', authMiddleware, tenantMiddleware, erpApiRouter);

app.use('/public', corePublicRouter);

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
}

// Error Handling
app.use(errorHandlers.notFound);
app.use(errorHandlers.productionErrors);

module.exports = app;
