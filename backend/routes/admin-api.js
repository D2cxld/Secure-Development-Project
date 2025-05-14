/**
 * Admin API Routes
 * Protected routes for admin dashboard functionality
 */

const express = require('express');
const router = express.Router();
const db = require('../utils/dbConfig');
const { authenticateToken, authorize } = require('../middleware/auth');
const { csrfProtection } = require('../utils/csrfUtils');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(authorize(['admin', 'superadmin']));

// === GET Dashboard Data ===
router.get('/dashboard', async (req, res) => {
  try {
    // Get dashboard stats
    const statsPromises = [
      // Total users count
      db.query('SELECT COUNT(*) as count FROM user_login'),
      // Admin users count
      db.query("SELECT COUNT(*) as count FROM user_login WHERE role = 'admin' OR role = 'superadmin'"),
      // New users in the last 7 days
      db.query('SELECT COUNT(*) as count FROM user_login WHERE created_at >= NOW() - INTERVAL \'7 days\''),
      // Admin whitelist entries
      db.query('SELECT * FROM admin_whitelist ORDER BY created_at DESC'),
      // Users with profile info
      db.query(`
        SELECT ul.username, ul.email, ul.role, ul.uses_2fa, ul.created_at
        FROM user_login ul
        LEFT JOIN user_profile up ON ul.username = up.username
        ORDER BY ul.created_at DESC
        LIMIT 50
      `)
    ];

    const [
      totalUsersResult,
      adminUsersResult,
      newUsersResult,
      whitelistResult,
      usersResult
    ] = await Promise.all(statsPromises);

    // For a real app, you would query for blog posts too
    const blogPostsCount = 0; // Placeholder

    // Format response
    const dashboardData = {
      stats: {
        totalUsers: totalUsersResult.rows[0].count,
        adminUsers: adminUsersResult.rows[0].count,
        blogPosts: blogPostsCount,
        newUsers: newUsersResult.rows[0].count
      },
      whitelist: whitelistResult.rows,
      users: usersResult.rows
    };

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error('❌ Error fetching admin dashboard data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// === Add to Admin Whitelist ===
router.post('/whitelist', csrfProtection, async (req, res) => {
  const { email } = req.body;
  const approvedBy = req.user.username;

  // Validate email
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  try {
    // Check if email already exists in whitelist
    const checkResult = await db.query(
      'SELECT * FROM admin_whitelist WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists in whitelist'
      });
    }

    // Add to whitelist
    await db.query(
      'INSERT INTO admin_whitelist (email, approved_by) VALUES ($1, $2)',
      [email, approvedBy]
    );

    // Return success
    return res.status(201).json({
      success: true,
      message: 'Email added to admin whitelist'
    });
  } catch (error) {
    console.error('❌ Error adding to whitelist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding to whitelist'
    });
  }
});

// === Remove from Admin Whitelist ===
router.delete('/whitelist/:id', csrfProtection, async (req, res) => {
  const id = req.params.id;

  try {
    // Superadmin can delete any entry, admin can only delete their own entries
    let query = 'DELETE FROM admin_whitelist WHERE id = $1';
    const params = [id];

    // If not superadmin, add approved_by constraint
    if (req.user.role !== 'superadmin') {
      query += ' AND approved_by = $2';
      params.push(req.user.username);
    }

    const result = await db.query(query, params);

    // Check if any row was deleted
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Whitelist entry not found or you don\'t have permission to delete it'
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Email removed from admin whitelist'
    });
  } catch (error) {
    console.error('❌ Error removing from whitelist:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing from whitelist'
    });
  }
});

// === Delete User (Superadmin only) ===
router.delete('/users/:username', csrfProtection, authorize(['superadmin']), async (req, res) => {
  const username = req.params.username;

  // Prevent superadmin from deleting themselves
  if (username === req.user.username) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account'
    });
  }

  try {
    // Use a transaction to ensure all related records are deleted
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Delete from user_profile first (due to foreign key constraints)
      await client.query(
        'DELETE FROM user_profile WHERE username = $1',
        [username]
      );

      // Delete from user_login
      const result = await client.query(
        'DELETE FROM user_login WHERE username = $1',
        [username]
      );

      // Check if user was found
      if (result.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await client.query('COMMIT');

      // Return success
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

module.exports = router;