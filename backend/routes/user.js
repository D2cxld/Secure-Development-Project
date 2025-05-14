const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth');
const db = require('../utils/dbConfig');

// Verify user token and return user info
router.get('/verify', authenticateToken, async (req, res) => {
try {
    // Token is already verified by authenticateToken middleware
    // req.user contains the decoded token data

    // Return user info (without sensitive data)
    res.json({
    username: req.user.username,
    role: req.user.role,
    id: req.user.id
    });
} catch (error) {
    console.error('⚠️ Error verifying user:', error);
    res.status(500).json({
    success: false,
    message: '⚠️ Server error verifying user'
    });
}
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
try {
    // Get user profile data from database
    const result = await db.query(
    'SELECT user_profile.* FROM user_profile WHERE username = $1',
    [req.user.username]
    );

    if (result.rows.length === 0) {
    return res.status(404).json({
        success: false,
        message: '⚠️ User profile not found'
    });
    }

    // Return profile data
    res.json({
    success: true,
    profile: result.rows[0]
    });
} catch (error) {
    console.error('⚠️ Error fetching profile:', error);
    res.status(500).json({
    success: false,
    message: '⚠️ Server error fetching profile'
    });
}
});

// Admin-only route example (will only work for admin and superadmin roles)
router.get('/admin-data', authenticateToken, authorize(['admin', 'superadmin']), (req, res) => {
res.json({
    success: true,
    message: '! This is admin-only data',
    data: {
    sensitive: true,
    adminAccess: true
    }
});
});

// Superadmin-only route example
router.get('/superadmin-data', authenticateToken, authorize(['superadmin']), (req, res) => {
res.json({
    success: true,
    message: '! This is superadmin-only data',
    data: {
    sensitive: true,
    superAdminAccess: true
    }
});
});

module.exports = router;