const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sendVerificationCode = require('../utils/emailService');
const twoFAManager = require('../utils/twoFAManager');
const db = require('../utils/dbConfig');
const PEPPER = process.env.PEPPER;

// === Add an admin to the whitelist ===
router.post('/whitelist', async (req, res) => {
  const { email, approved_by } = req.body;

  if (!email || !approved_by) {
    return res.status(400).send('❌ Email and approver username are required');
  }

  try {
    // Check if approver exists and is an admin or superadmin
    const approverCheck = await db.query(
      'SELECT role FROM user_login WHERE username = $1 AND (role = $2 OR role = $3)',
      [approved_by, 'admin', 'superadmin']
    );

    if (approverCheck.rows.length === 0) {
      return res.status(403).send('❌ Only admins can add to the whitelist');
    }

    // Check if email is already in whitelist
    const existingCheck = await db.query(
      'SELECT * FROM admin_whitelist WHERE email = $1',
      [email]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).send('❌ Email already in whitelist');
    }

    // Add to whitelist
    await db.query(
      'INSERT INTO admin_whitelist (email, approved_by) VALUES ($1, $2)',
      [email, approved_by]
    );

    return res.status(200).send('✅ Email added to admin whitelist');
  } catch (error) {
    console.error('❌ Failed to update whitelist:', error);
    return res.status(500).send('❌ Database error');
  }
});

// === Get whitelisted emails ===
router.get('/whitelist', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT email, approved_by, created_at FROM admin_whitelist ORDER BY created_at DESC'
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Failed to get whitelist:', error);
    return res.status(500).send('❌ Database error');
  }
});

// === Handle admin temporary registration (store data, send email) ===
router.post('/admin-temp', async (req, res) => {
  const { first_name, surname, email, username, password } = req.body;

  if (!first_name || !surname || !email || !username || !password) {
    return res.status(400).send('❌ All fields are required');
  }

  try {
    // Check whitelist
    const whitelistCheck = await db.query(
      'SELECT * FROM admin_whitelist WHERE email = $1',
      [email]
    );

    if (whitelistCheck.rows.length === 0) {
      return res.status(403).send('❌ Email not in admin whitelist');
    }

    // Generate verification code
    const code = twoFAManager.generateCode();

    // Hash password
    const hash = await bcrypt.hash(password + PEPPER, 10);

    // Store temporary admin data
    await twoFAManager.storeCode(username, email, code, {
      first_name,
      surname,
      password_hash: hash
    });

    // Send verification code
    await sendVerificationCode(email, code);

    return res.status(200).json({
      message: '✅ Verification code sent to your email',
      isAdmin: true,
      username
    });
  } catch (error) {
    console.error('❌ Failed to process admin registration:', error);
    return res.status(500).send('❌ Server error');
  }
});

// === Admin dashboard data ===
router.get('/dashboard', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).send('❌ Username is required');
  }

  try {
    // Verify user is an admin
    const adminCheck = await db.query(
      'SELECT role FROM user_login WHERE username = $1 AND (role = $2 OR role = $3)',
      [username, 'admin', 'superadmin']
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).send('❌ Admin access required');
    }

    // Get user stats
    const userStats = await db.query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_count,
        SUM(CASE WHEN uses_2fa = true THEN 1 ELSE 0 END) AS users_with_2fa
      FROM user_login
    `);

    // Get recent registrations
    const recentUsers = await db.query(`
      SELECT username, email, role, created_at
      FROM user_login
      ORDER BY created_at DESC
      LIMIT 5
    `);

    return res.status(200).json({
      stats: userStats.rows[0],
      recentUsers: recentUsers.rows
    });
  } catch (error) {
    console.error('❌ Failed to get admin dashboard data:', error);
    return res.status(500).send('❌ Database error');
  }
});

module.exports = router;
