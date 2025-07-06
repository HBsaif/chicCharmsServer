const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all configurations
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM configurations');
    const configurations = {};
    rows.forEach(row => {
      configurations[row.config_key] = row.config_value;
    });
    res.json(configurations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;