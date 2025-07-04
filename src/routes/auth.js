const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Secret for JWT - In a real app, this should be in an environment variable
const jwtSecret = 'supersecretjwtkey';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM managers WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const manager = results[0];

    const isMatch = await bcrypt.compare(password, manager.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      manager: {
        id: manager.id,
        username: manager.username,
      },
    };

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  });
});

module.exports = router;