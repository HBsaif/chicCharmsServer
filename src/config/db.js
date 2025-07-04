const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'mypass',
  database: 'chiccharms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise(); // Added .promise() here

module.exports = pool;