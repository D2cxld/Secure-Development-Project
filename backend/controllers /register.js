
const mysql = require('mysql');
// const bcrypt = require('bcrypt'); (optional if you want to hash passwords)

const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'Software007', 
    database: 'Blogdb',
    port: '3306',
});

exports.reg = (req, res) => {
    const { email, username, password, firstname, surname } = req.body;

    // Set role manually because HTML form doesn't send it
    const role = 'user';  

    connection.query(
        'SELECT * FROM user_login WHERE username = ? OR email = ?',
        [username, email],
        (err, results) => {
            if (err) {
                console.error('Error checking username/email existence: ' + err.stack);
                return res.status(500).send('Error checking database.');
            }

            if (results.length > 0) {
                return res.status(400).send('Username or email is already in use.');
            }

            const userData = {
                username,
                password,   // ⚠️ later you should hash password!
                email,
                first_name: firstname,
                last_name: surname,
                role
            };

            connection.query('INSERT INTO user_login SET ?', userData, (error, results) => {
                if (error) {
                    console.error('Error inserting user:', error);
                    return res.status(500).send('Error inserting user.');
                } else {
                    console.log('User registered successfully');
                    return res.status(200).send('Registration successful');
                }
            });
        }
    );
};
