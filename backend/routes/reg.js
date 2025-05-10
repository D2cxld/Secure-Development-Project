const express = require('express'); 
const router = express.Router();
require('dotenv').config();
const PEPPER = process.env.PEPPER;

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const mysql = require('mysql');

// Load the blacklist once at startup
const passwordBlacklist = fs.readFileSync(
  path.join(__dirname, '../data/common-passwords.txt'),
  'utf-8'
).split('\n').map(p => p.trim().toLowerCase());

console.log("🧠 Blacklist loaded:", passwordBlacklist);

// MySQL connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'bloguser',
  password: 'BlogPass123!',
  database: 'blogdb',
  port: 3306
});

// === Real registration handler ===
router.post('/', (req, res) => {
  const { username, password: rawPassword } = req.body;
  const password = rawPassword.trim();

  if (!username || !password) {
    return res.status(400).send('❌ Username and password are required.');
  }

  if (password.length < 8 || password.length > 64) {
    return res.status(400).send('❌ Password must be between 8 and 64 characters.');
  }

  if (passwordBlacklist.includes(password.toLowerCase())) {
    return res.status(400).send('❌ Password is too common.');
  }

  if (/^\d+$/.test(password)) {
    return res.status(400).send('❌ Password cannot be all numbers.');
  }

  connection.query(
    'SELECT * FROM user_login WHERE username = ?',
    [username],
    (err, results) => {
      if (err) {
        console.error('❌ DB check error:', err.message);
        return res.status(500).send('❌ Server error');
      }

      if (results.length > 0) {
        return res.status(409).send('❌ Username already taken.');
      }

      bcrypt.hash(password + PEPPER, 10, (err, hash) => {
        if (err) {
          console.error('❌ Hash error:', err.message);
          return res.status(500).send('❌ Hashing failed.');
        }

        connection.query(
          'INSERT INTO user_login (username, password_hash, role) VALUES (?, ?, ?)',
          [username, hash, 'user'],
          (err) => {
            if (err) {
              console.error('❌ DB insert error:', err.message);
              return res.status(500).send('❌ Could not create user.');
            }

            console.log(`✅ Registered new user: ${username}`);
            return res.status(200).send('✅ Registration successful.');
          }
        );
      });
    }
  );
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

      if (results.length > 0) {
        return res.json({ available: false });
      }

      return res.json({ available: true });
    }
  );
});

module.exports = router;
