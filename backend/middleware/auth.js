const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not defined in environment variables!');
  console.error('Please make sure you have JWT_SECRET set in your .env file');
}

// Middleware to verify JWT token
exports.authenticateToken = (req, res, next) => {
  // Get token from various sources
  const authHeader = req.headers['authorization'];
  const cookieToken = req.cookies?.token;
  const queryToken = req.query.token;
  
  // Check different sources for token
  const token = 
    (authHeader && authHeader.split(' ')[1]) || // From Authorization header
    cookieToken ||                             // From cookies
    queryToken;                               // From query string
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token is required',
      redirect: '/itslogin.html'
    });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token is for pre-auth (2FA flow)
    if (decoded.pre_auth) {
      return res.status(403).json({ 
        success: false, 
        message: 'Authentication incomplete - 2FA required',
        needs2FA: true,
        username: decoded.username
      });
    }
    
    // Set user data in request for downstream handlers
    req.user = decoded;
    console.log('✅ User authenticated:', decoded.username, 'with role:', decoded.role);
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token',
      redirect: '/itslogin.html'
    });
  }
};

// Role-based authorization middleware
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized - no role information'
      });
    }
    
    // Special case for superadmin - always allowed
    if (req.user.role === 'superadmin') {
      return next();
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      console.log(`❌ Access denied: ${req.user.username} with role ${req.user.role} tried to access ${req.originalUrl} but needs one of [${roles.join(', ')}]`);
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden: Insufficient permissions',
        required_roles: roles,
        user_role: req.user.role
      });
    }
    
    next();
  };
};