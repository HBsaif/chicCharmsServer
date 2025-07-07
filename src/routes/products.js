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
    const { sort, limit, is_featured } = req.query;
    let query = 'SELECT * FROM products';
    const queryParams = [];

    if (is_featured !== undefined) {
      const isFeaturedBoolean = is_featured === 'true';
      query += ' WHERE is_featured = ?';
      queryParams.push(isFeaturedBoolean);
    }

    if (sort === 'newest') {
      query += ' ORDER BY created_at DESC';
    }
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const [products] = await pool.query(query, queryParams);
    for (let product of products) {
      const [images] = await pool.query('SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?', [product.id]);
      const [variants] = await pool.query('SELECT id, color, quantity_in_stock FROM product_variants WHERE product_id = ?', [product.id]);
      product.images = images;
      product.variants = variants;
    }
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get a single product by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    const [images] = await pool.query('SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?', [id]);
    const [variants] = await pool.query('SELECT id, color, quantity_in_stock FROM product_variants WHERE product_id = ?', [id]);

    product.images = images;
    product.variants = variants;

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Add a new product (admin only) with image upload
router.post('/', authMiddleware, upload.array('images', 10), async (req, res) => {
  console.log('Request Body (Add Product):', req.body);
  console.log('Request Files (Add Product):', req.files);
  const { name, description, price, variants, is_featured } = req.body; // variants is a JSON string
  const createdBy = req.manager.id; // Assuming authMiddleware sets req.manager.id
  const isFeaturedBoolean = is_featured === 'true'; // Convert string to boolean

  try {
    const [result] = await pool.query('INSERT INTO products (name, description, price, created_by, is_featured) VALUES (?, ?, ?, ?, ?)', [name, description, price, createdBy, isFeaturedBoolean]);
    const productId = result.insertId;

    if (req.files && req.files.length > 0) {
      const imageInserts = req.files.map((file, index) => [
        productId,
        `/uploads/${file.filename}`,
        index === 0 // Set the first image as primary
      ]);
      await pool.query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ?', [imageInserts]);
    }

    if (variants) {
      const parsedVariants = JSON.parse(variants);
      if (parsedVariants.length > 0) {
        const variantInserts = parsedVariants.map(variant => [
          productId,
          variant.color,
          variant.quantity_in_stock
        ]);
        await pool.query('INSERT INTO product_variants (product_id, color, quantity_in_stock) VALUES ?', [variantInserts]);
      }
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
  const { name, description, price, variants, imagesToDelete, primaryImageId, is_featured } = req.body;
  const isFeaturedBoolean = is_featured === 'true'; // Convert string to boolean
  console.log('Received is_featured for update:', is_featured);

  try {
    // Update product details
    await pool.query('UPDATE products SET name = ?, description = ?, price = ?, is_featured = ? WHERE id = ?', [name, description, price, isFeaturedBoolean, id]);

    // Handle variants
    if (variants) {
      const parsedVariants = JSON.parse(variants);
      const [existingVariants] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [id]);

      const existingVariantIds = existingVariants.map(v => v.id);
      const incomingVariantIds = parsedVariants.filter(v => v.id).map(v => v.id);

      const variantsToDelete = existingVariantIds.filter(id => !incomingVariantIds.includes(id));
      if (variantsToDelete.length > 0) {
        await pool.query('DELETE FROM product_variants WHERE id IN (?)', [variantsToDelete]);
      }

      for (const variant of parsedVariants) {
        if (variant.id) { // Existing variant
          await pool.query('UPDATE product_variants SET color = ?, quantity_in_stock = ? WHERE id = ?', [variant.color, variant.quantity_in_stock, variant.id]);
        } else { // New variant
          await pool.query('INSERT INTO product_variants (product_id, color, quantity_in_stock) VALUES (?, ?, ?)', [id, variant.color, variant.quantity_in_stock]);
        }
      }
    }

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

    res.json({ message: 'Product updated' });

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
