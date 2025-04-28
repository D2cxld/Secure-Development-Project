const mysql = require('mysql');
const express = require('express');
const backreg = require('../backend/register');

const router = express.Router(); 

router.post('/register', backreg.register);

module.exports = router;