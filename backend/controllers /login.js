exports.login = (req, res, pool) => {
    const { username, password } = req.body;

    console.log('Username:', username);
    console.log('Password:', password);

    const query = 'SELECT * FROM "userlogin" WHERE username = $1';
    console.log("Executing SQL:", query, "with", [username]);


    pool.query(query, [username], (err, result) => {
        if (err) {
            console.error('Login DB error:', err.message);
            return res.status(500).send('Unable to connect to database');
        }

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        const user = result.rows[0];

        if (password !== user.password) {
            return res.status(401).send('Invalid username or password');
        }

        
        // Set session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
        };

        // Redirect based on role
        if (user.role === 'admin') {
            return res.redirect('/admin');
        } else {
            return res.redirect('/blog');
        }
    });
};
