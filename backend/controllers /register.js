
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'Software007', 
    database: 'Blogdb',
    port: '3306',
});

exports.reg = (req, res) => {
    console.log(req.body);

    const { email, username, password, firstname, surname } = req.body;

    connection.query(
        'SELECT * FROM user_login WHERE username = ? OR email = ?',
        [username, email],
        (err, results) => {
            if (err) {
                console.error('Error checking username/email existence: ' + err.stack);
                res.send('Error registering user');
                return;
            }

            
            if (results.length > 0) {
                res.send('Username or email is already in use');
                return;
            }

           
            const userData = {
                username,
                password,
                email,
                first_name: firstname,
                surname,
            };

            
            connection.query('INSERT INTO user_login SET ?', userData, (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(500).send('Error registering user');
                } else {
                    console.log('User registered successfully');
                    res.redirect('/register.html');
                }
            });
        }
    );
};







// Script for confirming the password in the registration page 
document.getElementById('registerForm').addEventListener('submit', function (e) {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
  
    if (password !== confirm) {
      e.preventDefault(); // Stop form submission
      errorDiv.textContent = 'Passwords do not match';
    } else {
      errorDiv.textContent = '';
    }
  });