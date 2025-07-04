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