require('dotenv').config();
const PEPPER = process.env.PEPPER;
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../utils/dbConfig');
const twoFAManager = require('../utils/twoFAManager');
const sendVerificationCode = require('../utils/emailService');
const csrfUtils = require('../utils/csrfUtils');

// === Login handler ===
router.post('/', csrfUtils.csrfProtection, async (req, res) => {
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

  // Verify password - try both with and without PEPPER for compatibility
  console.log(`🔄 Attempting password verification for user: ${username}`);
  console.log(`🔹 Password hash length: ${user.password_hash.length}`);

  // First try without PEPPER (new registrations use this approach)
  let match = await bcrypt.compare(password, user.password_hash);
  if (match) {
    console.log("✅ Password matched WITHOUT pepper!");
  } else {
    // Try with PEPPER as fallback (for older registrations)
    match = await bcrypt.compare(password + PEPPER, user.password_hash);
    if (match) {
      console.log("✅ Password matched WITH pepper!");
    } else {
      console.log("❌ Neither approach matched the password");
    }
  }

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

  // Regular login (no 2FA) - Set up session
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  // Get user profile data
  try {
    const profileResult = await db.query(
      'SELECT first_name, surname FROM user_profile WHERE username = $1',
      [user.username]
    );

    if (profileResult.rows.length > 0) {
      req.session.user.firstName = profileResult.rows[0].first_name;
      req.session.user.lastName = profileResult.rows[0].surname;
    }
  } catch (profileError) {
    console.error('⚠️ Could not load profile data:', profileError);
    // Not fatal, continue with login
  }

  // Determine redirect URL
  let redirectUrl = '/dashboard.html';
  if (user.role === 'admin') {
    redirectUrl = '/admin/dashboard.html';
  } else if (user.role === 'superadmin') {
    redirectUrl = '/superadmin/dashboard.html';
  }

  return res.status(200).json({
    message: '✅ Login successful',
    role: user.role,
    username: user.username,
    redirectUrl
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

  // Update session if this is the current user
  if (req.session.user && req.session.user.username === username) {
    req.session.user.uses2FA = uses2FA;
  }

  return res.status(200).send('✅ 2FA preference updated.');
} catch (error) {
  console.error('❌ Failed to update 2FA preference:', error.message);
  return res.status(500).send('❌ Could not update preference.');
}
});

// === Login verification with 2FA ===
router.post('/verify-2fa', csrfUtils.csrfProtection, async (req, res) => {
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
    'SELECT * FROM user_login WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return res.status(404).send('❌ User not found');
  }

  const user = result.rows[0];

  // Clean up the 2FA code
  await twoFAManager.deleteTemporaryData(username);

  // Set up session
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    uses2FA: true
  };

  // Get user profile data
  try {
    const profileResult = await db.query(
      'SELECT first_name, surname FROM user_profile WHERE username = $1',
      [user.username]
    );

    if (profileResult.rows.length > 0) {
      req.session.user.firstName = profileResult.rows[0].first_name;
      req.session.user.lastName = profileResult.rows[0].surname;
    }
  } catch (profileError) {
    console.error('⚠️ Could not load profile data:', profileError);
    // Not fatal, continue with login
  }

  // Determine redirect URL
  let redirectUrl = '/dashboard.html';
  if (user.role === 'admin') {
    redirectUrl = '/admin/dashboard.html';
  } else if (user.role === 'superadmin') {
    redirectUrl = '/superadmin/dashboard.html';
  }

  return res.status(200).json({
    message: '✅ Login successful',
    role: user.role,
    username: user.username,
    redirectUrl
  });
} catch (error) {
  console.error('❌ Error during 2FA verification:', error);
  return res.status(500).send('❌ Server error during verification');
}
});

// === Logout route ===
router.get('/logout', (req, res) => {
// Destroy the session
req.session.destroy((err) => {
  if (err) {
    console.error('❌ Error during logout:', err);
    return res.status(500).send('❌ Error logging out');
  }

  // Redirect to login page
  res.redirect('/itslogin.html');
});
});

// === Get current session info ===
router.get('/session-info', (req, res) => {
if (!req.session || !req.session.user) {
  return res.status(401).json({
    authenticated: false,
    message: 'Not authenticated'
  });
}

return res.json({
  authenticated: true,
  username: req.session.user.username,
  email: req.session.user.email,
  role: req.session.user.role,
  firstName: req.session.user.firstName,
  lastName: req.session.user.lastName
});
});

module.exports = router;