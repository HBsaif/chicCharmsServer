const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const orderStatusRoutes = require('./routes/orderStatuses');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/order-statuses', orderStatusRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Chic Charms API!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});