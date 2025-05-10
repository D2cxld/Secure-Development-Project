require('dotenv').config();
const PEPPER = process.env.PEPPER;
const express = require('express'); 
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const router = express.Router();

// SQL connection config - changed to be able to access MY SQL without issues...new dev/blog user implemented and good practice too on separate MySql tab
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'bloguser',
  password: 'BlogPass123!',
  database: 'secureblog_roles_v2',
  port: 3306
});

router.post('/', (req, res) => {
  const { username, password } = req.body;
  console.log("✅ DB connected, attempting login for:", username);

// Newly added router post
router.post('/set-2fa-preference', (req, res) => {
  const { username, uses2FA } = req.body;

  connection.query(
    'UPDATE user_login SET uses_2fa = ? WHERE username = ?',
    [uses2FA, username],
    (err) => {
      if (err) {
        console.error('❌ Failed to update 2FA preference:', err.message);
        return res.status(500).send('❌ Could not update preference.');
      }
      return res.status(200).send('✅ 2FA preference updated.');
    }
  );
}); 
  
  connection.query(
    'SELECT * FROM user_login WHERE username = ?',
    [username],
    (err, results) => {
      if (err) {
        console.error('❌ MySQL error:', err.message);
        return res.status(500).send('❌ DB error');
      }

      if (results.length === 0) {
        return res.status(401).send('❌ Invalid credentials');
      }

      const user = results[0];
      bcrypt.compare(password + PEPPER, user.password_hash, (err, match) => {
        console.log("🧠 Comparing:");
        console.log("Provided password (with pepper):", password + PEPPER);
        console.log("Stored hash:", user.password_hash);

        if (err) {
          console.error('❌ Bcrypt error:', err.message);
          return res.status(500).send('❌ Server error');
        }

        if (!match) {
          console.log("❌ Password mismatch");
          return res.status(401).send('❌ Invalid credentials');
        }

        console.log("✅ Password match! Logged in:", user.username);
        return res.json({ role: user.role, username: user.username });
      });

      
    }
  );
});

module.exports = router;
