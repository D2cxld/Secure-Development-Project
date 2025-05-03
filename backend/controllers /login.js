exports.login = (req, res,connection) => {
    const { username, password } = req.body;
    console.log('Username:', username);
    console.log('Password:', password);

    connection.query('SELECT username, password FROM user_login WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('Unable to connect to database');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = results[0];

        if (password !== user.password) {
            return res.status(401).send('Invalid username or password');
        }

        // SUCCESSFUL LOGIN
        return res.status(200).send('Login successful!');
    });
};

