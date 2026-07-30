const mysql = require('mysql2/promise');
const config = require('../config/env');

const pool = mysql.createPool({
  host: config.DB.HOST,
  user: config.DB.USER,
  password: config.DB.PASSWORD,
  database: config.DB.NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// Connection check helper
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ MySQL connected successfully to database: ${config.DB.NAME}`);
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection error:', err.message);
    return false;
  }
};

module.exports = { pool, testConnection };
