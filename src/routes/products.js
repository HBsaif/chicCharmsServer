const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all products (public)
router.get('/', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching products');
      return;
    }
    res.json(results);
  });
});

// Add a new product (admin only)
router.post('/', authMiddleware, (req, res) => {
  const { name, description, price, imageUrl } = req.body;
  db.query('INSERT INTO products (name, description, price, imageUrl) VALUES (?, ?, ?, ?)', [name, description, price, imageUrl], (err, result) => {
    if (err) {
      res.status(500).send('Error adding product');
      return;
    }
    res.status(201).json({ message: 'Product added', productId: result.insertId });
  });
});

// Update a product (admin only)
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, description, price, imageUrl } = req.body;
  db.query('UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ? WHERE id = ?', [name, description, price, imageUrl, id], (err, result) => {
    if (err) {
      res.status(500).send('Error updating product');
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product updated' });
    }
  });
});

// Delete a product (admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) {
      res.status(500).send('Error deleting product');
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product deleted' });
    }
  });
});

module.exports = router;