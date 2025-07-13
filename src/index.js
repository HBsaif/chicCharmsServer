require('dotenv').config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/products');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const orderStatusRoutes = require('./routes/orderStatuses');
const configurationRoutes = require('./routes/configurations');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const path = require('path');

const staticPath = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');
// console.log('Static Files Serving Path (index.js):', staticPath);
app.use('/uploads', express.static(staticPath));

const apiPrefix = process.env.API_PREFIX || '';

app.use(`${apiPrefix}/api/products`, productRoutes);
app.use(`${apiPrefix}/api/auth`, authRoutes);
app.use(`${apiPrefix}/api/users`, userRoutes);
app.use(`${apiPrefix}/api/orders`, orderRoutes);
app.use(`${apiPrefix}/api/order-statuses`, orderStatusRoutes);
app.use(`${apiPrefix}/api/configurations`, configurationRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Chic Charms API!');
});

app.get('/test', (req, res) => {
  res.send('Hello from the /test API endpoint!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});