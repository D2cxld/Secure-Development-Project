// server.js
const express = require("express");
const app = express();
const path = require('path');
const mysql = require('mysql');

// Setup MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Software007',
    database: 'Blogdb',
    port: '3306',
});

// Start server
app.listen(5500, () => {
    console.log("Server started on port 5500");
});

// Connect to MySQL
connection.connect((error) => {
    if (error) {
        console.log('Error connecting to MySQL database:', error);
        return;
    }
    console.log('Connected to MySQL database');
});

// Middleware
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
const registerRouter = require('./backend/routes/reg')(connection);  // Pass connection cleanly
app.use('/register', registerRouter);

const loginRouter = require('./backend/routes/log')(connection);
app.use('/login', loginRouter);


// Serve pages
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'front-end', 'register.html'));
});

app.get('/itslogin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'front-end', 'itslogin.html'));
});


// Serve static assets
app.get("/styles.css", (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get("/js/register.js", (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, 'front-end', 'js', 'register.js'));
});
