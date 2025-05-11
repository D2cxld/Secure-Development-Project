// backend/routes/reg.js (simplified for admin 2FA flow)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sendVerificationCode = require('../utils/emailService');
const PEPPER = process.env.PEPPER;

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '23Benedict:)',
  database: 'secureblog_roles_v2',
  port: 3306
});

// Handle admin registration step (store in session, send email)
router.post('/admin-temp', async (req, res) => {
  const { first_name, surname, email, username, password } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000);

  try {
    req.session.tempAdmin = { first_name, surname, email, username, password };
    req.session.adminCode = code;
    await sendVerificationCode(email, code);
    res.status(200).json({ message: '✅ Code sent', isAdmin: true });
  } catch (err) {
    console.error('❌ Failed to send 2FA email:', err);
    res.status(500).send('❌ Email error');
  }
});

// Verify code and commit to DB
router.post('/admin-verify', async (req, res) => {
  const { code } = req.body;
  const temp = req.session.tempAdmin;

  if (!temp || parseInt(code) !== req.session.adminCode) {
    return res.status(401).send('❌ Invalid or expired code');
  }

  const hash = await bcrypt.hash(temp.password + PEPPER, 10);

  connection.query(
    'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES (?, ?, ?, ?, ?)',
    [temp.username, temp.email, hash, 'admin', 1],
    (err) => {
      if (err) return res.status(500).send('❌ DB error');

      connection.query(
        'INSERT INTO user_profile (username, first_name, surname) VALUES (?, ?, ?)',
        [temp.username, temp.first_name, temp.surname],
        (err) => {
          if (err) return res.status(500).send('✅ Login created, profile failed');

          delete req.session.tempAdmin;
          delete req.session.adminCode;
          return res.status(200).send('✅ Admin registered');
        }
      );
    }
  );
});

module.exports = router;
