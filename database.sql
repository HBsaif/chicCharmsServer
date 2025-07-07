-- Section 1: Database Creation and Selection
-- Run this section once to create the database and select it.
CREATE DATABASE IF NOT EXISTS chiccharms;
USE chiccharms;

-- Section 2: Products Table
-- Run this section to create or recreate the products table.
-- This will clear existing product data if the table already exists.
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,
  is_featured BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (created_by) REFERENCES managers(id) ON DELETE SET NULL
);

ALTER TABLE products
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN created_by INT,
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE,
ADD FOREIGN KEY (created_by) REFERENCES managers(id) ON DELETE SET NULL;

-- Insert sample product data
INSERT INTO products (name, description, price) VALUES
('Elegant Evening Clutch', 'A beautiful clutch for a night out.', 75.00),
('Classic Leather Tote', 'A spacious and stylish tote for everyday use.', 120.00),
('Bohemian Crossbody Bag', 'A chic and casual crossbody bag.', 65.00),
('Stylish Backpack', 'A modern backpack for the fashion-forward woman.', 95.00);

-- Section 2.1: Product Images Table
DROP TABLE IF EXISTS product_images;
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample product image data
INSERT INTO product_images (product_id, image_url, is_primary) VALUES
(1, '/uploads/clutch_1.jpg', TRUE),
(1, '/uploads/clutch_2.jpg', FALSE),
(2, '/uploads/tote_1.jpg', TRUE),
(2, '/uploads/tote_2.jpg', FALSE),
(3, '/uploads/crossbody_1.jpg', TRUE),
(3, '/uploads/crossbody_2.jpg', FALSE),
(4, '/uploads/backpack_1.jpg', TRUE),
(4, '/uploads/backpack_2.jpg', FALSE);

-- Section 2.2: Product Variants Table
DROP TABLE IF EXISTS product_variants;
CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color VARCHAR(50) NOT NULL,
  color_name VARCHAR(255),
  quantity_in_stock INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample product variant data
INSERT INTO product_variants (product_id, color, quantity_in_stock) VALUES
(1, 'Gold', 10),
(1, 'Silver', 5),
(2, 'Black', 15),
(2, 'Brown', 8),
(3, 'Tan', 12),
(4, 'Black', 20);

-- Section 3: Managers Table
-- Run this section to create or recreate the managers table.
-- This will clear existing manager data if the table already exists.
DROP TABLE IF EXISTS managers;
CREATE TABLE managers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- Insert default admin user
-- Username: admin
-- Password: password (hashed using bcrypt)
INSERT INTO managers (username, password_hash) VALUES
('admin', '$2b$10$7jgYlNsaHlTDUELqOk/sI.g3.8rEYuQPrNanAFF4DN2moNRlLDjiK');

-- Section 4: Users Table
-- Run this section to create or recreate the users table.
-- This will clear existing user data if the table already exists.
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);

-- Insert a sample user
-- Username: testuser
-- Email: user@example.com
-- Password: userpassword (hashed using bcrypt)
INSERT INTO users (username, email, password_hash) VALUES
('testuser', 'user@example.com', '$2b$10$kN1I046u0IwdNG7eIWni2OikzS8kYu60i9rpdFZohYgDe3myxtHXO');

-- Section 5: Order Statuses Table
DROP TABLE IF EXISTS order_statuses;
CREATE TABLE order_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO order_statuses (status_name) VALUES ('Pending'), ('Processing'), ('Shipped'), ('Completed'), ('Cancelled');

-- Section 6: Orders Table
-- Run this section to create or recreate the orders table.
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status_id INT NOT NULL DEFAULT 1,
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (status_id) REFERENCES order_statuses(id)
);

-- Section 7: Order Items Table
-- Run this section to create or recreate the order_items table.
DROP TABLE IF EXISTS order_items;
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  variant_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- Insert sample order data
INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, total_amount, status_id) VALUES
(1, 'Test User', '123-456-7890', '123 Main St, Anytown, USA', 195.00, 1),
(NULL, 'Guest Customer', '098-765-4321', '456 Oak Ave, Somewhere, USA', 65.00, 4);

-- Insert sample order items data
INSERT INTO order_items (order_id, variant_id, quantity, price) VALUES
(1, 1, 1, 75.00),
(1, 3, 1, 120.00),
(2, 5, 1, 65.00);

-- Section 8: Configurations Table
DROP TABLE IF EXISTS configurations;
CREATE TABLE configurations (
  config_key VARCHAR(255) NOT NULL PRIMARY KEY,
  config_value TEXT
);

INSERT INTO configurations (config_key, config_value) VALUES
('shipping_inside_dhaka', '60.00'),
('shipping_outside_dhaka', '120.00'),
('facebook_link', 'https://www.facebook.com/chiccharms'),
('instagram_link', 'https://www.instagram.com/chiccharms'),
('about_us_text', 'Welcome to Chic Charms! We offer exquisite bags for every style and occasion. Our mission is to provide high-quality, fashionable accessories that elevate your look.'),
('contact_email', 'info@chiccharms.com'),
('contact_phone', '+8801XXXXXXXXX'),
('contact_address', '123 Fashion Street, Dhaka, Bangladesh'),
('shipping_returns_policy', 'Shipping: We offer nationwide shipping. Delivery within Dhaka takes 2-3 business days, outside Dhaka takes 5-7 business days. Returns: Items can be returned within 7 days of purchase if unused and in original condition.'),
('testimonials_data', '[{"author": "Sarah J.", "text": "I absolutely love my new bag! The quality is amazing and it\'s so stylish. I get compliments on it everywhere I go."}, {"author": "Emily R.", "text": "Chic Charms has the best selection of bags. I found the perfect one for my sister\'s birthday and she was thrilled."}, {"author": "Jessica L.", "text": "I\'m so impressed with the customer service. They were so helpful and my order arrived quickly. I\'ll definitely be shopping here again."}]');