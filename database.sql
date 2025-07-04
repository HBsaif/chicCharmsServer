
CREATE DATABASE IF NOT EXISTS chiccharms;

USE chiccharms;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  imageUrl VARCHAR(255)
);

INSERT INTO products (name, description, price, imageUrl) VALUES
('Elegant Evening Clutch', 'A beautiful clutch for a night out.', 75.00, '/images/clutch.jpg'),
('Classic Leather Tote', 'A spacious and stylish tote for everyday use.', 120.00, '/images/tote.jpg'),
('Bohemian Crossbody Bag', 'A chic and casual crossbody bag.', 65.00, '/images/crossbody.jpg'),
('Stylish Backpack', 'A modern backpack for the fashion-forward woman.', 95.00, '/images/backpack.jpg');
