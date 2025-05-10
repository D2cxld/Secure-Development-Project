const express = require('express');
const router = express.Router();
require('dotenv').config();
const PEPPER = process.env.PEPPER;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql');

// Load blacklist
const passwordBlacklist = fs.readFileSync(
  path.join(__dirname, '../data/common-passwords.txt'),
  'utf-8'
).split('\n').map(p => p.trim().toLowerCase());

console.log("🧠 Blacklist loaded:", passwordBlacklist);

// MySQL connection
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

  if (!first_name || !surname || !email || !username || !password) {
    return res.status(400).send('❌ All fields are required.');
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

  // If role is 'admin', check whitelist first
  if (role === 'admin') {
    connection.query(
      'SELECT * FROM admin_whitelist WHERE email = ?',
      [email],
      (err, whitelistResults) => {
        if (err) {
          console.error('❌ Whitelist DB error:', err.message);
          return res.status(500).send('❌ Server error');
        }

        if (whitelistResults.length === 0) {
          return res.status(403).send('❌ Email not authorized for admin registration.');
        }

        proceedWithUserCreation();
      }
    );
  } else {
    proceedWithUserCreation();
  }

  function proceedWithUserCreation() {
    connection.query(
      'SELECT * FROM user_login WHERE username = ? OR email = ?',
      [username, email],
      (err, results) => {
        if (err) return res.status(500).send('❌ DB error.');
        if (results.length > 0) {
          return res.status(409).send('❌ Username or email already taken.');
        }

        bcrypt.hash(password + PEPPER, 10, (err, hash) => {
          if (err) return res.status(500).send('❌ Hashing failed.');

          connection.query(
            'INSERT INTO user_login (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, hash, role],
            (err) => {
              if (err) return res.status(500).send('❌ Failed to create user_login.');

              connection.query(
                'INSERT INTO user_profile (username, first_name, surname) VALUES (?, ?, ?)',
                [username, first_name, surname],
                (err) => {
                  if (err) return res.status(500).send('✅ Login created, but profile failed.');
                  return res.status(200).send('✅ Registration successful.');
                }
              );
            }
          );
        });
      }
    );
  }
});

// === Live username availability check ===
router.get('/check-username', (req, res) => {
  const username = req.query.username;
  console.log("✅ check-username route hit:", username);

  if (!username) {
    return res.status(400).send('Username is required');
  }

  connection.query(
    'SELECT * FROM user_login WHERE username = ?',
    [username],
    (err, results) => {
      if (err) {
        console.error('❌ Username check error:', err.message);
        return res.status(500).send('❌ Server error');
      }

      return res.json({ available: results.length === 0 });
    }
  );
});


module.exports = router;
