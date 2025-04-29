// auth.js is to handkle password changes 
const mysql = require('mysql');
const express = require('express');
const authcontroller = require('../../controllers/auth');

const router =express.Router(); 

router.post('/resetpassword',authcontroller.resetpassword);

module.exports= router; 