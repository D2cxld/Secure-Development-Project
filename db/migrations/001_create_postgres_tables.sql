-- Drop tables if they exist
DROP TABLE IF EXISTS user_profile;
DROP TABLE IF EXISTS admin_whitelist;
DROP TABLE IF EXISTS user_login;

-- Create user_login table
CREATE TABLE user_login (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) DEFAULT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'admin', 'superadmin')) DEFAULT 'user',
  uses_2fa BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_profile table
CREATE TABLE user_profile (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE REFERENCES user_login(username) ON DELETE CASCADE,
  first_name VARCHAR(100),
  surname VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_whitelist table
CREATE TABLE admin_whitelist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  approved_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create temp_admin_registration table for storing admin data during 2FA
CREATE TABLE temp_admin_registration (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  surname VARCHAR(100),
  verification_code VARCHAR(6),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);