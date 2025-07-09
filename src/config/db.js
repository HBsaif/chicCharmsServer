const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chiccharms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // Added .promise() here

module.exports = pool;