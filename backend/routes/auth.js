require('dotenv').config();
const PEPPER = process.env.PEPPER;
const JWT_SECRET = process.env.JWT_SECRET;
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../utils/dbConfig');
const twoFAManager = require('../utils/twoFAManager');
const sendVerificationCode = require('../utils/emailService');
const { csrfProtection } = require('../utils/csrfUtils');

// Generate JWT token
const generateToken = (user) => {
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

// === Login handler ===
router.post('/', csrfProtection, async (req, res) => {
  const { username, password } = req.body;
  console.log("✅ DB connected, attempting login for:", username);

  try {
    // Find user
    const result = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '❌ Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password
    const match = await bcrypt.compare(password + PEPPER, user.password_hash);

    if (!match) {
      console.log("❌ Password mismatch for user:", username);
      return res.status(401).json({
        success: false,
        message: '❌ Invalid credentials'
      });
    }

    console.log("✅ Password match! Logged in:", user.username);

    // Check if 2FA is required
    if (user.uses_2fa) {
      // Generate and send 2FA code
      const code = twoFAManager.generateCode();
      await twoFAManager.storeCode(user.username, user.email, code);
      await sendVerificationCode(user.email, code);

      // Generate a short-lived pre-auth token
      const preAuthToken = jwt.sign(
        { 
          id: user.id, 
          username: user.username,
          pre_auth: true
        },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.status(200).json({
        success: true,
        message: '✅ 2FA code sent to your email',
        needs2FA: true,
        username: user.username,
        email: user.email,
        preAuthToken
      });
    }

    // Generate a JWT token
    const token = generateToken(user);

    // Regular login (no 2FA)
    return res.status(200).json({
      success: true,
      message: '✅ Login successful',
      role: user.role,
      username: user.username,
      token,
      redirect: user.role === 'admin' || user.role === 'superadmin' ? '/admin-dashboard.html' : '/blog.html'
    });
  } catch (error) {
    console.error('❌ Database error during login:', error);
    return res.status(500).json({
      success: false,
      message: '❌ Server error during login'
    });
  }
});

// === 2FA preference update ===
router.post('/set-2fa-preference', csrfProtection, async (req, res) => {
  const { username, uses2FA } = req.body;

  try {
    await db.query(
      'UPDATE user_login SET uses_2fa = $1 WHERE username = $2',
      [uses2FA, username]
    );

    return res.status(200).json({
      success: true,
      message: '✅ 2FA preference updated.'
    });
  } catch (error) {
    console.error('❌ Failed to update 2FA preference:', error.message);
    return res.status(500).json({
      success: false,
      message: '❌ Could not update preference.'
    });
  }
});

// === Login verification with 2FA ===
router.post('/verify-2fa', csrfProtection, async (req, res) => {
  const { username, code, preAuthToken } = req.body;

  if (!username || !code) {
    return res.status(400).json({
      success: false,
      message: '❌ Username and code are required'
    });
  }

  try {
    // Verify the pre-auth token
    let decoded;
    try {
      decoded = jwt.verify(preAuthToken, JWT_SECRET);
      if (!decoded.pre_auth || decoded.username !== username) {
        throw new Error('Invalid pre-auth token');
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '❌ Invalid or expired 2FA session'
      });
    }

    const isValid = await twoFAManager.verifyCode(username, code);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: '❌ Invalid or expired verification code'
      });
    }

    // Get the user info now that 2FA is verified
    const result = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '❌ User not found'
      });
    }

    const user = result.rows[0];

    // Clean up the 2FA code
    await twoFAManager.deleteTemporaryData(username);

    // Generate a full JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: '✅ Login successful',
      role: user.role,
      username: user.username,
      token,
      redirect: user.role === 'admin' || user.role === 'superadmin' ? '/admin-dashboard.html' : '/blog.html'
    });
  } catch (error) {
    console.error('❌ Error during 2FA verification:', error);
    return res.status(500).json({
      success: false,
      message: '❌ Server error during verification'
    });
  }
});

module.exports = router;