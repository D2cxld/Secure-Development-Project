require('dotenv').config();
const PEPPER = process.env.PEPPER;
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../utils/dbConfig');
const twoFAManager = require('../utils/twoFAManager');
const sendVerificationCode = require('../utils/emailService');

// === Login handler ===
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  console.log("✅ DB connected, attempting login for:", username);

  try {
    // Find user
    const result = await db.query(
      'SELECT * FROM user_login WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).send('❌ Invalid credentials');
    }

    const user = result.rows[0];

    // Verify password
    const match = await bcrypt.compare(password + PEPPER, user.password_hash);

    if (!match) {
      console.log("❌ Password mismatch for user:", username);
      return res.status(401).send('❌ Invalid credentials');
    }

    console.log("✅ Password match! Logged in:", user.username);

    // Check if 2FA is required
    if (user.uses_2fa) {
      // Generate and send 2FA code
      const code = twoFAManager.generateCode();
      await twoFAManager.storeCode(user.username, user.email, code);
      await sendVerificationCode(user.email, code);

      return res.status(200).json({
        message: '✅ 2FA code sent to your email',
        needs2FA: true,
        username: user.username,
        email: user.email
      });
    }

    // Regular login (no 2FA)
    return res.status(200).json({
      message: '✅ Login successful',
      role: user.role,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Database error during login:', error);
    return res.status(500).send('❌ Server error during login');
  }
});

// === 2FA preference update ===
router.post('/set-2fa-preference', async (req, res) => {
  const { username, uses2FA } = req.body;

  try {
    await db.query(
      'UPDATE user_login SET uses_2fa = $1 WHERE username = $2',
      [uses2FA, username]
    );

    return res.status(200).send('✅ 2FA preference updated.');
  } catch (error) {
    console.error('❌ Failed to update 2FA preference:', error.message);
    return res.status(500).send('❌ Could not update preference.');
  }
});

// === Login verification with 2FA ===
router.post('/verify-2fa', async (req, res) => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).send('❌ Username and code are required');
  }

  try {
    const isValid = await twoFAManager.verifyCode(username, code);

    if (!isValid) {
      return res.status(401).send('❌ Invalid or expired verification code');
    }

    // Get the user info now that 2FA is verified
    const result = await db.query(
      'SELECT role, username FROM user_login WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('❌ User not found');
    }

    const user = result.rows[0];

    // Clean up the 2FA code
    await twoFAManager.deleteTemporaryData(username);

    return res.status(200).json({
      message: '✅ Login successful',
      role: user.role,
      username: user.username
    });
  } catch (error) {
    console.error('❌ Error during 2FA verification:', error);
    return res.status(500).send('❌ Server error during verification');
  }
});

module.exports = router;
