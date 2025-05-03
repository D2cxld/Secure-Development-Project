//log.js is to handle the login of the page
// backend/routes/log.js
const express = require('express');
const loginController = require('/Users/davidorji/Secure Development Project/Secure-Development-Project/backend/controllers /login.js');  // FIXED path and name

const mysql = require('mysql');


module.exports = (connection) => {
    const router = express.Router();

    // Attach the connection to controller
    router.post('/', (req, res) => {
        loginController.login(req, res, connection);
    });

    return router;
};
