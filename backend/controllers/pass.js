const mysql = require('mysql');
const bcrypt = require('bcryptjs');

const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'Software007', 
    database: 'Blogdb',
    port: '3306',
});

exports.reg = async (req, res) => {
    console.log(req.body);

    const { email, username, password, firstname, surname } = req.body;

    connection.query(
        'SELECT * FROM Blogdb WHERE username = ? OR email = ?',
        [username, email],
        async (err, results) => {
            if (err) {
                console.error('Error checking username/email existence: ' + err.stack);
                res.send('Error registering user');
                return;
            }

            if (results.length > 0) {
                res.send('Username or email is already in use');
                return;
            }

            try {
                // 🔐 Hash password before inserting
                const hashedPassword = await bcrypt.hash(password, 10);

                const userData = {
                    username,
                    password: hashedPassword,
                    email,
                    first_name: firstname,
                    surname,
                };

                connection.query('INSERT INTO  SET ?', userData, (error, results) => {
                    if (error) {
                        console.error(error);
                        res.status(500).send('Error registering user');
                    } else {
                        console.log('User registered successfully');
                        res.redirect('/log');
                    }
                });
            } catch (hashError) {
                console.error('Error hashing password:', hashError);
                res.status(500).send('Internal error. Please try again.');
            }
        }
    );
};
