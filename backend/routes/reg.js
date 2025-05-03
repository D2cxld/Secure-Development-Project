
const express = require('express');
const registercontroller = require('/Users/davidorji/Secure Development Project/Secure-Development-Project/backend/controllers /register.js');

const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Software007',
    database: 'Blogdb',
    port: '3306'
});

connection.connect((error) => {
    if (error) {
        console.error('Error connecting to MySQL:', error);
    } else {
        console.log('Connected to MySQL (routes/reg.js)');
    }
});

module.exports = (connection) => {
    const router = express.Router();

    router.post('/reg', (req, res) => {
        registercontroller.reg(req, res, connection);  // Pass connection to controller
    });

    router.get('/check-username', (req, res) => {
        const username = req.query.username;
        if (!username) {
            return res.status(400).send('Username is required');
        }

        connection.query('SELECT * FROM user_login WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error('Error checking username:', err.stack);
                return res.status(500).send('Error checking username');
            }

            if (results.length > 0) {
                res.json({ available: false });
            } else {
                res.json({ available: true });
            }
        });
    });

    return router;
};
