const express = require('express');
const router = express.Router();

// Simple test route to set a cookie
router.get('/', (req, res) => {
  // Set a test cookie
  res.cookie('test_cookie', 'test_value', {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({
    message: 'Test cookie set',
    cookieName: 'test_cookie',
    cookieValue: 'test_value'
  });
});

module.exports = router;