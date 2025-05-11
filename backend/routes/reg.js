const express = require('express');  
const router = express.Router();
require('dotenv').config();
const PEPPER = process.env.PEPPER;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const sendVerificationCode = require('../utils/emailService');

// Load Blacklist
const passwordBlacklist = fs.readFileSync(
  path.join(__dirname, '../data/common-passwords.txt'),
  'utf-8'
).split('\n').map(p => p.trim().toLowerCase());

console.log("🧠 Blacklist loaded:", passwordBlacklist);

// My SQL connection 
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '23Benedict:)',
  database: 'secureblog_roles_v2',
  port: 3306
});

// === Registration handler ===
router.post('/', (req, res) => {
  const { first_name, surname, email, username, password: rawPassword, role = 'user' } = req.body;
  const password = rawPassword.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!first_name || !surname || !email || !username || !password) {
    return res.status(400).send('\u274c All fields are required.');
  }

  if (!emailRegex.test(email)) {
    return res.status(400).send('\u274c Invalid email format.');
  }

  if (password.length < 8 || password.length > 64) {
    return res.status(400).send('\u274c Password must be 8–64 characters.');
  }
  if (passwordBlacklist.includes(password.toLowerCase())) {
    return res.status(400).send('\u274c Password is too common.');
  }
  if (/^\d+$/.test(password)) {
    return res.status(400).send('\u274c Password cannot be all numbers.');
  }

  // If role is admin check whitelist first
  connection.query(
    'SELECT * FROM user_login WHERE username = ? OR email = ?',
    [username, email],
    (err, results) => {
      if (err) return res.status(500).send('\u274c DB error.');
      if (results.length > 0) {
        return res.status(409).send('\u274c Username or email already taken.');
      }

      // Check if the email is in the admin whitelist
      connection.query(
        'SELECT * FROM admin_whitelist WHERE email = ?',
        [email],
        (err, whitelistResults) => {
          if (err) return res.status(500).send('\u274c Whitelist DB error.');

          const isAdmin = whitelistResults.length > 0;
          const finalRole = isAdmin ? 'admin' : role;
          const uses2FA = isAdmin ? 1 : 0;

          bcrypt.hash(password + PEPPER, 10, (err, hash) => {
            if (err) return res.status(500).send('\u274c Hashing failed.');

            connection.query(
              'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES (?, ?, ?, ?, ?)',
              [username, email, hash, finalRole, uses2FA],
              (err) => {
                if (err) {
                  console.error('❌ Failed to create user_login:', err.message);
                  return res.status(500).send('\u274c Failed to create user_login.');
                }

                connection.query(
                  'INSERT INTO user_profile (username, first_name, surname) VALUES (?, ?, ?)',
                  [username, first_name, surname],
                  async (err) => {
                    if (err) return res.status(500).send('\u2705 Login created, but profile failed.');

                    if (isAdmin) {
                      const code = Math.floor(100000 + Math.random() * 900000);
                      // console.log("📨 Sending email to", email, "with code:", code);
                      console.log(`📧 Sending 2FA code to ${email}: ${code}`);

                      try {
                        await sendVerificationCode(email, code);
                        global.twoFACodes = global.twoFACodes || {};
                        global.twoFACodes[username] = code;
                      } catch (emailError) {
                        console.error('\u274c Failed to send verification email:', emailError);
                      }
                    }

                    return res.status(200).json({ 
                      message: '✅ Registration successful.', 
                      role: finalRole, 
                      isAdmin 
                    });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

// === Live username availability check ===
router.get('/check-username', (req, res) => {
  const username = req.query.username;
  console.log("\u2705 check-username route hit:", username);

  if (!username) {
    return res.status(400).send('Username is required');
  }

  connection.query(
    'SELECT * FROM user_login WHERE username = ?',
    [username],
    (err, results) => {
      if (err) {
        console.error('\u274c Username check error:', err.message);
        return res.status(500).send('\u274c Server error');
      }

      return res.json({ available: results.length === 0 });
    }
  );
});

// === Live email availability check ===
router.get('/check-email', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send('Email is required');
  }

  connection.query(
    'SELECT * FROM user_login WHERE email = ?',
    [email],
    (err, results) => {
      if (err) {
        console.error('❌ Email check error:', err.message);
        return res.status(500).send('❌ Server error');
      }

      return res.json({ available: results.length === 0 });
    }
  );
});


module.exports = router;
