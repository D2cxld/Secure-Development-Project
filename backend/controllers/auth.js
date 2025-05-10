const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: 'Software007', 
    database: 'Blogdb',
    port: '3306',
});

exports.resetpassword = (req, res) => {
    console.log(req.body);

    const { username, oldPassword, newPassword } = req.body;

    connection.query('SELECT password FROM User_login WHERE username = ?', [username], function (error, result) {
        if (error) {
            console.log("Error fetching password from database:", error);
            return res.render('password', {
                message: 'Error occurred, please try again later'
            });
        }

        if (result.length === 0) {
            console.log("No user found with username:", username);
            return res.render('password', {
                message: 'Username is incorrect'
            });
        }

        const storedPassword = result[0].password;

        console.log("Stored password:", storedPassword);

        
        if (oldPassword !== storedPassword) {
            return res.render('password', {
                message: 'Old password is incorrect'
            });
        }

        
        connection.query('UPDATE User_login SET password = ? WHERE username = ?', [newPassword, username], function (error, result) {
            if (error) {
                console.log(error);
                return res.render('password', {
                    message: 'Error occurred, please try again later'
                });
            }
            else 
            res.redirect('/log');
        });
    });
};
