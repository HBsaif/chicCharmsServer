const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM order_statuses');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching order statuses');
  }
});

module.exports = router;