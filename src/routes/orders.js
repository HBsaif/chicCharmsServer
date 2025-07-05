const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all orders (admin only)
router.get('/', authMiddleware, async (req, res) => {
  const query = `
    SELECT
      o.id AS order_id,
      o.total_amount,
      os.status_name AS status,
      o.order_date,
      o.customer_name,
      o.customer_phone,
      o.customer_address,
      u.username AS user_username,
      u.email AS user_email,
      GROUP_CONCAT(CONCAT(pi.name, ' (x', oi.quantity, ')') SEPARATOR '; ') AS products_summary
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products pi ON oi.product_id = pi.id
    LEFT JOIN order_statuses os ON o.status_id = os.id
    GROUP BY o.id
    ORDER BY o.order_date DESC
  `;

  try {
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get a single order by ID (admin only)
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [orderRows] = await pool.query(`
      SELECT
        o.id AS order_id,
        o.user_id,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.total_amount,
        os.status_name AS status,
        o.order_date,
        u.username AS user_username,
        u.email AS user_email
      FROM orders o
      JOIN order_statuses os ON o.status_id = os.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (orderRows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [itemRows] = await pool.query(`
      SELECT
        oi.quantity,
        oi.price,
        p.name AS product_name,
        p.imageUrl
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    const order = {
      ...orderRows[0],
      items: itemRows
    };

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching order details' });
  }
});

// Update order status (admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { statusId } = req.body;

  try {
    const [result] = await pool.query('UPDATE orders SET status_id = ? WHERE id = ?', [statusId, id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.json({ message: 'Order status updated' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// Cancel an order (admin only)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('UPDATE orders SET status_id = 5 WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Order not found' });
    } else {
      res.json({ message: 'Order cancelled' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

// Place a new order (public)
router.post('/place', async (req, res) => {
  const { userId, totalAmount, items, shippingInfo } = req.body;
  const { name, phone, address } = shippingInfo; // Destructure new fields
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert into orders table with new customer info
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, phone, address, totalAmount, 1]
    );
    const orderId = orderResult.insertId;

    // Insert into order_items table
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully', orderId });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;