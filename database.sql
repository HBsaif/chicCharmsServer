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
  imageUrl VARCHAR(255)
);

-- Insert sample product data
INSERT INTO products (name, description, price, imageUrl) VALUES
('Elegant Evening Clutch', 'A beautiful clutch for a night out.', 75.00, '/images/clutch.jpg'),
('Classic Leather Tote', 'A spacious and stylish tote for everyday use.', 120.00, '/images/tote.jpg'),
('Bohemian Crossbody Bag', 'A chic and casual crossbody bag.', 65.00, '/images/crossbody.jpg'),
('Stylish Backpack', 'A modern backpack for the fashion-forward woman.', 95.00, '/images/backpack.jpg');

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
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert sample order data
INSERT INTO orders (user__id, customer_name, customer_phone, customer_address, total_amount, status_id) VALUES
(1, 'Test User', '123-456-7890', '123 Main St, Anytown, USA', 195.00, 1),
(NULL, 'Guest Customer', '098-765-4321', '456 Oak Ave, Somewhere, USA', 65.00, 4);

-- Insert sample order items data
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 75.00),
(1, 2, 1, 120.00),
(2, 3, 1, 65.00);