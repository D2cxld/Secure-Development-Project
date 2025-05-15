
// backend/routes/log.js
const express = require('express');
const router = express.Router();
const loginController = require('/Users/davidorji/Secure Development Project/Secure-Development-Project/backend/controllers /login.js'); 

module.exports = (pool) => {
    router.post('/', (req, res) => {
        loginController.login(req, res, pool); 
    });

    return router;
};
