-- RateHub Database Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS ratestore;
USE ratestore;

CREATE TABLE IF NOT EXISTS users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  address       VARCHAR(400) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'store_owner', 'admin') DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  owner_id       INT NOT NULL,
  name           VARCHAR(255) NOT NULL,
  address        VARCHAR(400) NOT NULL,
  category       VARCHAR(100) DEFAULT 'General',
  description    TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_ratings  INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ratings (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  store_id   INT NOT NULL,
  rating     INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_store (user_id, store_id)
);

CREATE INDEX idx_store_owner ON stores(owner_id);
CREATE INDEX idx_rating_user  ON ratings(user_id);
CREATE INDEX idx_rating_store ON ratings(store_id);
