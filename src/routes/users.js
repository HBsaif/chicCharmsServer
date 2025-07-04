const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db'); // Changed db to pool
const authMiddleware = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [results] = await pool.query('SELECT id, username, email FROM users');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching users');
  }
});

// Add a new user (admin only)
router.post('/', authMiddleware, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, password_hash]);
    res.status(201).json({ message: 'User added', userId: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).send('Error adding user');
  }
});

// Update a user (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { username, email, password } = req.body;
  let updateFields = [];
  let queryParams = [];

  if (username) { updateFields.push('username = ?'); queryParams.push(username); }
  if (email) { updateFields.push('email = ?'); queryParams.push(email); }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    updateFields.push('password_hash = ?'); queryParams.push(password_hash);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  queryParams.push(id);

  try {
    const [result] = await pool.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, queryParams);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.json({ message: 'User updated' });
    }
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).send('Error updating user');
  }
});

// Delete a user (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.json({ message: 'User deleted' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting user');
  }
});

module.exports = router;