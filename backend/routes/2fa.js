const express = require('express');
const router = express.Router();

// === POST /2fa/verify-2fa ===
router.post('/verify-2fa', (req, res) => {
  const { username, code } = req.body;

  if (!username || !code) {
    return res.status(400).send('❌ Username and code are required');
  }

  global.twoFACodes = global.twoFACodes || {};

  const expectedCode = global.twoFACodes[username];

  if (!expectedCode) {
    return res.status(400).send('❌ No 2FA code found for this user.');
  }

  if (code === String(expectedCode)) {
    // Optionally delete the code to prevent reuse
    delete global.twoFACodes[username];
    return res.status(200).send('✅ 2FA verification successful');
  } else {
    return res.status(401).send('❌ Invalid 2FA code');
  }
});

module.exports = router;
