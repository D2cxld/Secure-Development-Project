//log.js is to handle the login of the page
// backend/routes/log.js
const express = require('express');
const loginController = require('/Users/davidorji/Secure Development Project/Secure-Development-Project/backend/controllers /login.js');  // FIXED path and name

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
        console.error('Error connecting to Postgresql:', error);
    } else {
        console.log('Connected to Postgresql (routes/log.js)');
    }
});

//router.post('/', async (req, res) => {
 // const { email, password } = req.body;
  // ... authenticate user ...

 // if (authenticated) {
 //   req.session.userId = user.id; // Store user ID in session
 //   res.redirect('/blogpage.html');
 // } else {
 //   res.status(401).send('Invalid credentials');
 // }
//});


module.exports = (connection) => {
    const router = express.Router();

    // Attach the connection to controller
    router.post('/', (req, res) => {
        loginController.login(req, res, connection);
    });

    return router;
};
