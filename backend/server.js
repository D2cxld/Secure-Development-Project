
const express = require("express");
const app = express();
const path = require('path');
const mysql = require('mysql');


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Software007',
    database: 'Blogdb',
    port: '3306',
});

app.listen(5500, () => {
    console.log("Server started on port 5500");
});



connection.connect((error) => {
    if (error) {
        console.log('Error connecting to MySQL database:', error);
        return;
    }
    console.log('Connected to MySQL database');
});

//middleware 

const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/auth', require('backend/auth.js'));
app.use('/log', require('./backend/log'));
app.use('/register', require('./backend/register'));
app.set('view engine', 'html')


//routes for each page 

//routes for serving the server.js file 
app.get("/server.js", (req, res) => {
    res.type('text/javascript');
    res.sendFile(path.join(__dirname, 'server.js'));
});

//route for serving their css

app.get("/styles.css", (req, res) => {
    res.type('text/css');
    res.sendFile(path.join(__dirname, 'pms/public/stylesheets/styles.css'))
}

