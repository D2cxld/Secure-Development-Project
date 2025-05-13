const express = require("express");
const app = express();
const path = require('path');
require('dotenv').config();

// Import Docker connection instead of MySQL
const db = require('../docker/db/docker-connection');

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
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/login', require('./routes/auth'));

// Root route - redirect to register page
app.get('/', (req, res) => {
  res.redirect('/register.html');
});

// Routes
app.use('/register', require('./routes/reg'));
app.use('/2fa', require('./routes/2fa'));
app.use('/admin', require('./routes/admin'));

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
  
// Serve static assets
app.get('/styles.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, '../Front-end', 'styles.css'));
});  

// Serve JavaScript
app.get('/js/register.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, '../Front-end', 'javascript', 'register.js'));
});