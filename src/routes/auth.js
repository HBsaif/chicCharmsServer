const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Changed db to pool
const authMiddleware = require('../middleware/authMiddleware');

// Secret for JWT - In a real app, this should be in an environment variable
const jwtSecret = 'supersecretjwtkey';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [results] = await pool.query('SELECT * FROM managers WHERE username = ?', [username]);

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const managerId = req.manager.id; // Assuming req.manager.id holds the manager's ID from authMiddleware

  try {
    const [results] = await pool.query('SELECT password_hash FROM managers WHERE id = ?', [managerId]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    const manager = results[0];
    const isMatch = await bcrypt.compare(oldPassword, manager.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid old password' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE managers SET password_hash = ? WHERE id = ?', [password_hash, managerId]);

    res.json({ message: 'Manager password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error changing manager password');
  }
});

module.exports = router;