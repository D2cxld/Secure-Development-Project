const express = require('express');
const router = express.Router();
require('dotenv').config();
const PEPPER = process.env.PEPPER;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../utils/dbConfig');
const sendVerificationCode = require('../utils/emailService');
const twoFAManager = require('../utils/twoFAManager');

// Load Blacklist
const passwordBlacklist = fs.readFileSync(
  path.join(__dirname, '../data/common-passwords.txt'),
  'utf-8'
).split('\n').map(p => p.trim().toLowerCase());

console.log("🧠 Blacklist loaded with", passwordBlacklist.length, "common passwords");

// === Registration handler ===
router.post('/', async (req, res) => {
  const { first_name, surname, email, username, password: rawPassword, role = 'user' } = req.body;
  const password = rawPassword.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validation
  if (!first_name || !surname || !email || !username || !password) {
    return res.status(400).send('❌ All fields are required.');
  }

  if (!emailRegex.test(email)) {
    return res.status(400).send('❌ Invalid email format.');
  }

  if (password.length < 8 || password.length > 64) {
    return res.status(400).send('❌ Password must be 8–64 characters.');
  }

  if (passwordBlacklist.includes(password.toLowerCase())) {
    return res.status(400).send('❌ Password is too common.');
  }

  if (/^\d+$/.test(password)) {
    return res.status(400).send('❌ Password cannot be all numbers.');
  }

  try {
    // Check if username or email already exists
    const userCheck = await db.query(
      'SELECT * FROM user_login WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).send('❌ Username or email already taken.');
    }

    // Check if the email is in the admin whitelist
    const whitelistCheck = await db.query(
      'SELECT * FROM admin_whitelist WHERE email = $1',
      [email]
    );

    const isAdmin = whitelistCheck.rows.length > 0;
    const finalRole = isAdmin ? 'admin' : role;
    const uses2FA = isAdmin ? true : false;

    // Hash the password
    const hash = await bcrypt.hash(password + PEPPER, 10);

    // Handle admin registration differently - store temporarily until 2FA verified
    if (isAdmin) {
      // Generate a verification code
      const code = twoFAManager.generateCode();
      console.log(`📧 Sending 2FA code to ${email}: ${code}`);

      try {
        // Store the admin data temporarily with the verification code
        await twoFAManager.storeCode(username, email, code, {
          first_name,
          surname,
          password_hash: hash
        });

        // Send the verification code
        await sendVerificationCode(email, code);

        // Respond with success, but note that registration isn't complete until 2FA
        return res.status(200).json({
          message: '✅ Verification code sent. Please check your email.',
          role: finalRole,
          isAdmin,
          username,
          needs2FA: true
        });
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        return res.status(500).send('❌ Failed to send verification email. Please try again.');
      }
    }

    // Regular user registration (non-admin) - proceed directly
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert into user_login
      await client.query(
        'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES ($1, $2, $3, $4, $5)',
        [username, email, hash, finalRole, uses2FA]
      );

      // Insert into user_profile
      await client.query(
        'INSERT INTO user_profile (username, first_name, surname) VALUES ($1, $2, $3)',
        [username, first_name, surname]
      );

      await client.query('COMMIT');

      return res.status(200).json({
        message: '✅ Registration successful.',
        role: finalRole,
        isAdmin: false,
        username
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('❌ Database error during registration:', dbError);
      return res.status(500).send('❌ Registration failed due to a database error.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Server error during registration:', error);
    return res.status(500).send('❌ Server error during registration.');
  }
});

// === Live username availability check ===
router.get('/check-username', async (req, res) => {
  const username = req.query.username;
  console.log("✅ check-username route hit:", username);

  if (!username) {
    return res.status(400).send('Username is required');
  }

  try {
    const result = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );

    // Also check temp_admin_registration for usernames in verification
    const tempResult = await db.query(
      'SELECT * FROM temp_admin_registration WHERE username = $1',
      [username]
    );

    const available = (result.rows.length === 0 && tempResult.rows.length === 0);
    return res.json({ available });
  } catch (error) {
    console.error('❌ Username check error:', error.message);
    return res.status(500).send('❌ Server error');
  }
});

// === Live email availability check ===
router.get('/check-email', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  try {
    const result = await db.query(
      'SELECT * FROM user_login WHERE email = $1',
      [email]
    );

    // Also check temp_admin_registration for emails in verification
    const tempResult = await db.query(
      'SELECT * FROM temp_admin_registration WHERE email = $1',
      [email]
    );

    const available = (result.rows.length === 0 && tempResult.rows.length === 0);
    return res.json({ available });
  } catch (error) {
    console.error('❌ Email check error:', error.message);
    return res.status(500).send('❌ Server error');
  }
});

module.exports = router;
