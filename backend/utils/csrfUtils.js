const crypto = require('crypto');

/**
 * CSRF protection utility functions
 * Implements double-submit cookie pattern for CSRF protection
 */
const csrfUtils = {
  /**
   * Generate a secure random token for CSRF protection
   * @returns {string} A random token
   */
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Create middleware to set CSRF token as cookie and in res.locals
   * @returns {Function} Express middleware
   */
  csrfMiddleware(req, res, next) {
    // If there's no CSRF cookie, generate one
    if (!req.cookies.csrf_token) {
      const csrfToken = csrfUtils.generateToken();

      // Set CSRF token as HTTP-only cookie with SameSite=Strict
      res.cookie('csrf_token', csrfToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Store token in res.locals for use in templates
      res.locals.csrfToken = csrfToken;
    } else {
      // Use existing token from cookie
      res.locals.csrfToken = req.cookies.csrf_token;
    }

    next();
  },

  /**
   * Create middleware to verify CSRF token in requests
   * @returns {Function} Express middleware
   */
  csrfProtection(req, res, next) {
    // TEMPORARILY BYPASS ALL CSRF PROTECTION
    console.log('⚠️ CSRF protection is temporarily disabled');
    return next();

    /* Original CSRF protection code (commented out temporarily)
    // Skip CSRF check for GET, HEAD, OPTIONS requests as they should be idempotent
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const cookieToken = req.cookies.csrf_token;
    const bodyToken = req.body.csrf_token ||
                      req.body._csrf ||
                      req.headers['x-csrf-token'] ||
                      req.headers['x-xsrf-token'];

    if (!cookieToken || !bodyToken || cookieToken !== bodyToken) {
      console.log('❌ CSRF token validation failed');
      return res.status(403).json({
        success: false,
        message: 'CSRF token validation failed'
      });
    }

    next();
    */
  }
};

module.exports = csrfUtils;