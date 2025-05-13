// backend/controllers/registerController.js
const bcrypt = require('bcryptjs');
const db = require('../utils/dbConfig');
const { validatePassword } = require('../utils/passwordValidator');
require('dotenv').config();
const PEPPER = process.env.PEPPER;

exports.register = async (req, res) => {
  try {
    const { email, username, password, firstname, surname } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    // Password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password does not meet requirements', 
        errors: passwordCheck.errors 
      });
    }
    
    // Check if username or email already exists
    const checkResult = await db.query(
      'SELECT * FROM user_login WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }
    
    // Hash password with bcrypt and pepper
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password + PEPPER, saltRounds);
    
    // Insert new user with role 'user'
    const role = 'user';
    const insertResult = await db.query(
      'INSERT INTO user_login (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, hashedPassword, role]
    );
    
    const userId = insertResult.rows[0].id;
    
    // Create user profile
    await db.query(
      'INSERT INTO user_profile (user_id, username, first_name, surname) VALUES ($1, $2, $3, $4)',
      [userId, username, firstname || null, surname || null]
    );
    
    // Log registration
    await db.query(
      'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [userId, 'REGISTER', req.ip]
    );
    
    return res.status(201).json({ 
      success: true, 
      message: 'Registration successful'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};