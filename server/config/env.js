require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 9900,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ROUTSEXTENSION: process.env.ROUTSEXTENSION || '/api/website/enquiry',
  JWT_SECRET: process.env.JWT_SECRET || 'Vedika@1234',
  HASH_SALT: process.env.HASH_SALT || '10',
  DB: {
    HOST: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    USER: process.env.DATABASE_USER || process.env.DB_USER || 'root',
    PASSWORD: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'Sonu@1990#',
    NAME: process.env.DATABASE_NAME || process.env.DB_NAME || 'esakshya2',
    PORT: process.env.DATABASE_PORT || 3306,
  },
  CLIENT_ORIGINS: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:9900',
        'http://122.180.245.249',
        'http://esakshya.copsuvidha.com',
        'https://esakshya.copsuvidha.com',
      ],
};
