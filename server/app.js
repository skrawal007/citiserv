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
    origin: config.CLIENT_ORIGINS,
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

// Direct Routes & API Routes
app.use('/', characterRoutes);
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
