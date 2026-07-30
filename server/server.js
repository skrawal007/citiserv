const app = require('./app');
const { testConnection } = require('./database/db');
const config = require('./config/env');

const PORT = config.PORT;

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`🚀 CCTNS AGRA API server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  await testConnection();
});

// Graceful Shutdown
const shutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
