const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Images will be stored in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM products');
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Add a new product (admin only) with image upload
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  console.log('Request Body (Add Product):', req.body);
  console.log('Request File (Add Product):', req.file);
  const { name, description, price } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Store path relative to server

  try {
    const [result] = await pool.query('INSERT INTO products (name, description, price, imageUrl) VALUES (?, ?, ?, ?)', [name, description, price, imageUrl]);
    res.status(201).json({ message: 'Product added', productId: result.insertId, imageUrl: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update a product (admin only) with optional image upload
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  console.log('Request Body (Update Product):', req.body);
  console.log('Request File (Update Product):', req.file);
  const { name, description, price } = req.body;
  let imageUrl = req.body.imageUrl; // Keep existing imageUrl if no new file is uploaded

  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const [result] = await pool.query('UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ? WHERE id = ?', [name, description, price, imageUrl, id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product updated', imageUrl: imageUrl });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating product' });
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
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;
