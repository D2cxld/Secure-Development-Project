const express = require("express");
const app = express();
const path = require('path');
require('dotenv').config();


// Start server
app.listen(8000, "0.0.0.0", () => {
    console.log("Server started on port 8000");
});


// Middleware
const publicDirectory = path.join(__dirname, '../Front-end'); // <-- Corrected
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

// Additional for server.js adding new protected user routes without replacing anything
app.use('/api/user', require('./routes/user'));


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
  

  
// Serve static assets
app.get('/styles.css', (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, '../Front-end', 'styles.css')); //same change if needed to revert
  });  

// Serve JavaScript
app.get('/js/register.js', (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, '../Front-end', 'javascript', 'register.js')); //same change if needed to revert
  });
