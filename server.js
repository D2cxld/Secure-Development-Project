const express = require("express");
const app = express();
const path = require('path');
const { Pool } = require('pg');

// Setup PostgreSQL connection
const pool = new Pool({
    user: 'davidorji', // <-- Replace with your actual Postgres username
    host: 'localhost',
    database: 'blogsdb',
    password: 'Nightcrawler007',
    port: 5432,
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch((err) => console.error('PostgreSQL connection error:', err.stack));

// Middleware
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Routes
const registerRouter = require('./backend/routes/reg')(pool);  // ✅ use pool
app.use('/register', registerRouter);

const loginRouter = require('./backend/routes/log')(pool);
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

// Start server
app.listen(5500, () => {
    console.log("Server started on port 5500"); // ✅ Correct port
});
