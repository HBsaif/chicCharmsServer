const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_BASE_DIR = path.join(__dirname, '..', '..', 'uploads');

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
    const [products] = await pool.query('SELECT * FROM products');
    for (let product of products) {
      const [images] = await pool.query('SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?', [product.id]);
      product.images = images;
    }
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Add a new product (admin only) with image upload
router.post('/', authMiddleware, upload.array('images', 10), async (req, res) => {
  console.log('Request Body (Add Product):', req.body);
  console.log('Request Files (Add Product):', req.files);
  const { name, description, price } = req.body;

  try {
    const [result] = await pool.query('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [name, description, price]);
    const productId = result.insertId;

    if (req.files && req.files.length > 0) {
      const imageInserts = req.files.map((file, index) => [
        productId,
        `/uploads/${file.filename}`,
        index === 0 // Set the first image as primary
      ]);
      await pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?', [imageInserts]);
    }

    res.status(201).json({ message: 'Product added', productId: productId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update a product (admin only) with optional image upload
router.put('/:id', authMiddleware, upload.array('images', 10), async (req, res) => {
  const { id } = req.params;
  console.log('Request Body (Update Product):', req.body);
  console.log('Request Files (Update Product):', req.files);
  const { name, description, price, imagesToDelete, primaryImageId } = req.body;

  try {
    // Update product details
    const [result] = await pool.query('UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?', [name, description, price, id]);

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const imageInserts = req.files.map((file, index) => [
        id,
        `/uploads/${file.filename}`,
        false // New images are not primary by default, unless explicitly set later
      ]);
      await pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?', [imageInserts]);
    }

    // Handle image deletions
    if (imagesToDelete && imagesToDelete.length > 0) {
      const imageIds = JSON.parse(imagesToDelete);
      // Fetch image URLs before deleting from DB
      const [imagesToDeleteData] = await pool.query('SELECT image_url FROM product_images WHERE id IN (?) AND product_id = ?', [imageIds, id]);

      await pool.query('DELETE FROM product_images WHERE id IN (?) AND product_id = ?', [imageIds, id]);

      // Delete physical files
      imagesToDeleteData.forEach(imageData => {
        const imagePath = path.join(UPLOADS_BASE_DIR, path.basename(imageData.image_url));
        console.log('Attempting to delete file at path:', imagePath);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error('Error deleting physical image file during product update:', err);
          }
        });
      });
    }

    // Handle primary image update
    if (primaryImageId) {
      await pool.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = ?', [id]);
      await pool.query('UPDATE product_images SET is_primary = TRUE WHERE id = ? AND product_id = ?', [primaryImageId, id]);
    }

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
    } else {
      res.json({ message: 'Product updated' });
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

// Delete a product image (admin only)
router.delete('/:productId/images/:imageId', authMiddleware, async (req, res) => {
  const { productId, imageId } = req.params;
  try {
    // Get the image URL before deleting from the database
    const [imageRows] = await pool.query('SELECT image_url FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);

    if (imageRows.length === 0) {
      return res.status(404).json({ message: 'Image not found or does not belong to this product' });
    }

    const imageUrl = imageRows[0].image_url;
    const imagePath = path.join(UPLOADS_BASE_DIR, path.basename(imageUrl)); // Construct absolute path
    console.log('Attempting to delete file at path:', imagePath);

    // Delete from database
    const [result] = await pool.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Image not found or does not belong to this product' });
    } else {
      // Delete physical file
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting physical image file:', err);
          // Log the error but still send success response as DB record is deleted
        }
      });
      res.json({ message: 'Image deleted' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;
