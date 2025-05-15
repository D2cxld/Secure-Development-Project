const express = require("express");
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();
const { csrfMiddleware } = require('./utils/csrfUtils');
const csrfInjection = require('./middleware/csrfInjection');


// Set port from environment or default to 5500 to match README
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
});


// Middleware
const publicDirectory = path.join(__dirname, '../Front-end'); // <-- Corrected

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, enable in production
  xssFilter: true,
  noSniff: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// Body parsers
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// CSRF protection middleware - sets CSRF token as cookie and res.locals.csrfToken
app.use(csrfMiddleware);

// Inject CSRF tokens into HTML forms
app.use(csrfInjection);

// Log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Auth routes
app.use('/login', require('./routes/auth'));

// Root route - redirect to register page
app.get('/', (req, res) => {
  res.redirect('/register.html');
});

// Routes
app.use('/register', require('./routes/reg'));
app.use('/2fa', require('./routes/2fa'));
app.use('/admin', require('./routes/admin'));

// Additional for server.js adding new protected user routes without replacing anything
app.use('/api/user', require('./routes/user'));

// Admin API routes (protected by authentication and role-based access)
app.use('/api/admin', require('./routes/admin-api'));


// Serve pages
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end', 'register.html')); //if changing back for sync later change '../Front-end' for 'Public'
  });



  // Serve blog landing page  // ***Added as roles increased once basics completed
app.get('/blog.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end', 'blog.html'));
  });
  // Serve blog front end log in page  // ***Added having connect MySQL and looking at building secure log in page
  app.get('/itslogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end', 'itslogin.html'));
  });

  // Serve admin dashboard page
  app.get('/admin-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end', 'admin-dashboard.html'));
  });



// Serve static assets
app.get('/styles.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, '../Front-end', 'styles.css')); //same change if needed to revert
  });

// Serve JavaScript files
app.get('/javascript/register.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, '../Front-end', 'javascript', 'register.js'));
  });

// Serve blog.js
app.get('/javascript/blog.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, '../Front-end', 'javascript', 'blog.js'));
  });

// Serve admin-dashboard.js
app.get('/javascript/admin-dashboard.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, '../Front-end', 'javascript', 'admin-dashboard.js'));
  });