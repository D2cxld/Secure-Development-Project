const express = require('express');
const router = express.Router();
const db = require('../utils/dbConfig');
const twoFAManager = require('../utils/twoFAManager');

// === POST /2fa/verify ===
router.post('/verify', require('../utils/csrfUtils').csrfProtection, async (req, res) => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).send('❌ Username and code are required');
  }

  try {
    // Verify the code
    const isValid = await twoFAManager.verifyCode(username, code);

    if (!isValid) {
      return res.status(401).send('❌ Invalid or expired 2FA code');
    }

    // Get the temporary registration data
    const tempData = await twoFAManager.getRegistrationData(username);

    if (tempData) {
      // This is a new admin registration that needs to be completed
      const { email, password_hash, first_name, surname } = tempData;

      // Begin transaction
      const client = await db.pool.connect();

      try {
        await client.query('BEGIN');

        // Insert into user_login
        await client.query(
          'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES ($1, $2, $3, $4, $5)',
          [username, email, password_hash, 'admin', true]
        );

        // Insert into user_profile
        await client.query(
          'INSERT INTO user_profile (username, first_name, surname) VALUES ($1, $2, $3)',
          [username, first_name, surname]
        );

        await client.query('COMMIT');

        // Delete the temporary data
        await twoFAManager.deleteTemporaryData(username);

        return res.status(200).send('✅ Admin registration complete');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to complete admin registration:', error);
        return res.status(500).send('❌ Database error during registration');
      } finally {
        client.release();
      }
    }

    // For existing users who are just logging in with 2FA
    await twoFAManager.deleteTemporaryData(username);
    return res.status(200).send('✅ 2FA verification successful');
  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    return res.status(500).send('❌ Server error during verification');
  }
});

// === POST /2fa/resend ===
router.post('/resend', async (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).send('❌ Username and email are required');
  }

  try {
    const sendVerificationCode = require('../utils/emailService');
    const code = twoFAManager.generateCode();

    // Store the new code
    await twoFAManager.storeCode(username, email, code);

    // Send the email
    await sendVerificationCode(email, code);

    return res.status(200).send('✅ New verification code sent');
  } catch (error) {
    console.error('❌ Failed to resend verification code:', error);
    return res.status(500).send('❌ Error sending verification code');
  }
});

module.exports = router;