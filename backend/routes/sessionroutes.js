const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      userId: req.session.user.id,
      username: req.session.user.username,
      isAdmin: req.session.user.isAdmin || false
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

module.exports = router;
