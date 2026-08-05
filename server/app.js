const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');

const characterRoutes = require('./routes/characterRoutes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching CORS_ORIGIN
      if (!origin || config.CLIENT_ORIGINS.includes(origin) || config.CLIENT_ORIGINS.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
  })
);

// Logging Middleware
if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic Route Extension Mount
const routeExt = config.ROUTSEXTENSION ? config.ROUTSEXTENSION.replace(/\/$/, '') : '/api/website/enquiry';

app.use(routeExt, characterRoutes);
app.use(`${routeExt}/`, characterRoutes);
app.use('/', characterRoutes);
app.use('/api', characterRoutes);
app.use('/api/characters', characterRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'CCTNS AGRA API running', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CCTNS AGRA API running', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
