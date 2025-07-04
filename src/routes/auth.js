
const express = require('express');
const router = express.Router();

// For simplicity, using hardcoded credentials. In a real application, use a database and proper hashing.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // In a real app, generate and send a JWT token
    res.json({ message: 'Login successful', token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

module.exports = router;
