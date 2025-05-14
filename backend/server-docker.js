const express = require("express");
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

// Import Docker connection instead of MySQL
const db = require('../docker/db/docker-connection');

// Import CSRF utilities
const { csrfMiddleware } = require('./utils/csrfUtils');
const csrfInjection = require('./middleware/csrfInjection');

// SMTP Config check
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log("✅ Email Configuration:");
  console.log(`✅ EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`✅ EMAIL_PASS length: ${process.env.EMAIL_PASS.length}`);
}

// Start server
app.listen(5500, "0.0.0.0", () => {
    console.log("Server started on port 5500");
});

// Middleware
const publicDirectory = path.join(__dirname, '../Front-end');

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
app.use('/login', require('./routes/auth'));

// Root route - redirect to register page
app.get('/', (req, res) => {
  res.redirect('/register.html');
});

// Routes
app.use('/register', require('./routes/reg'));
app.use('/2fa', require('./routes/2fa'));
app.use('/admin', require('./routes/admin'));
app.use('/test-cookie', require('./routes/test-cookie')); // Add test cookie route
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin-api')); // Admin API routes

// Serve pages
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end', 'register.html'));
});  

// Serve blog landing page
app.get('/blog.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Front-end', 'blog.html'));
});  

// Serve blog front end log in page
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
    res.sendFile(path.join(__dirname, '../Front-end', 'styles.css'));
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