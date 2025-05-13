// controllers/auth.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/dbConfig');
const { validatePassword } = require('../utils/passwordValidator');
require('dotenv').config();

const PEPPER = process.env.PEPPER;
const JWT_SECRET = process.env.JWT_SECRET;

// Reset password handler
exports.resetPassword = async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  
  try {
    // Basic validation
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Password validation
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        errors: passwordCheck.errors
      });
    }
    
    // Get user
    const userResult = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify old password
    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(oldPassword + PEPPER, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash and update new password
    const newHash = await bcrypt.hash(newPassword + PEPPER, 10);
    
    await db.query(
      'UPDATE user_login SET password_hash = $1 WHERE username = $2',
      [newHash, username]
    );
    
    // Log the action
    await db.query(
      'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'PASSWORD_RESET', req.ip]
    );
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// Generate JWT token
exports.generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Login handler (if not already in routes/auth.js)
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Find user
    const result = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password + PEPPER, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = this.generateToken(user);
    
    // Log login
    await db.query(
      'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'LOGIN', req.ip]
    );
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};