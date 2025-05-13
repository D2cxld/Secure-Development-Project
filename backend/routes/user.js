const express = require('express');
const router = express.Router();
const db = require('../utils/dbConfig');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get user profile (requires authentication)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile data
    const result = await db.query(
      `SELECT u.username, u.email, u.role, p.first_name, p.surname 
       FROM user_login u
       LEFT JOIN user_profile p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      profile: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// Admin-only route (requires admin role)
router.get('/all', authenticateToken, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.role, p.first_name, p.surname 
       FROM user_login u
       LEFT JOIN user_profile p ON u.id = p.user_id
       ORDER BY u.username`
    );
    
    return res.status(200).json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

module.exports = router;