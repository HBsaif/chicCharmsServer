const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Changed db to pool
const authMiddleware = require('../middleware/authMiddleware');

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM products');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching products');
  }
});

// Add a new product (admin only)
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, price, imageUrl } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO products (name, description, price, imageUrl) VALUES (?, ?, ?, ?)', [name, description, price, imageUrl]);
    res.status(201).json({ message: 'Product added', productId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding product');
  }
});

// Update a product (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl } = req.body;
  try {
    const [result] = await pool.query('UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ? WHERE id = ?', [name, description, price, imageUrl, id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product updated' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating product');
  }
});

// Delete a product (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product deleted' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting product');
  }
});

module.exports = router;