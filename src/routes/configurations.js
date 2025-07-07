const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

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

// Update a configuration (admin only)
router.put('/:config_key', authMiddleware, async (req, res) => {
  const { config_key } = req.params;
  const { config_value } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE configurations SET config_value = ? WHERE config_key = ?',
      [config_value, config_key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    res.json({ message: 'Configuration updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;