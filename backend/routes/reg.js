const express = require('express');
const registercontroller = require('../controllers/register');
const router = express.Router(); 

router.post('/reg', registercontroller.reg);

router.get('/check-username', (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    connection.query(
        'SELECT * FROM user_login WHERE username = ?',
        [username],
        (err, results) => {
            if (err) {
                console.error('Error checking username:', err.stack);
                return res.status(500).send('Error checking username');
            }

            if (results.length > 0) {
                res.json({ available: false });
            } else {
                res.json({ available: true });
            }
        }
    );
});

module.exports = router;
