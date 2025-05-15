const express = require("express");
const app = express();
const path = require('path');
const { Pool } = require('pg');

// Setup PostgreSQL connection
const pool = new Pool({
    user: 'postgres', // <-- Replace with your actual Postgres username
    host: 'localhost',
    database: 'blogsdb',
    password: 'Nightcrawler007',
    port: 5434,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => console.error('PostgreSQL connection error:', err.stack));

// Middleware
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const session = require('express-session');

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // Set true if using HTTPS
}));



// Routes
const registerRouter = require('./backend/routes/reg')(pool);  
app.use('/register', registerRouter);

const loginRouter = require('./backend/routes/log')(pool);
app.use('/login', loginRouter);

const postRouter = require('./backend/routes/postroutes');
app.use('/posts', postRouter);

// Serve pages

const frontEndDirectory = path.join(__dirname, 'front-end');
app.use(express.static(frontEndDirectory));
  
// Serve static assets
app.get("/styles.css", (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get("/js/register.js", (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, 'front-end', 'js', 'register.js'));
});

app.get('/js/postalert.js', (req, res) => {
  res.type('text/javascript');
  res.sendFile(path.join(__dirname, 'front-end', 'js', 'postalert.js'));
});

// Route to handle requests for the blog page

// Start server
app.listen(5500, () => {
    console.log("Server started on port 5500"); // 
});
