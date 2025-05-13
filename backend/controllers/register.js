 const bcrypt = require('bcryptjs');
  const pg = require('pg');
  require('dotenv').config();
  const PEPPER = process.env.PEPPER;

  // PostgreSQL connection
  const pool = new pg.Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'secureblog_roles_v2',
      port: parseInt(process.env.DB_PORT) || 5433
  });

  exports.reg = async (req, res) => {
      console.log('Registration request received:', req.body);

      const { first_name, surname, email, username, password } = req.body;
      const role = 'user';  // Default role

      // Basic validation
      if (!first_name || !surname || !email || !username || !password) {
          return res.status(400).send('! All fields are required.');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          return res.status(400).send('⚠️ Invalid email format.');
      }

      // Password validation
      if (password.length < 8 || password.length > 64) {
          return res.status(400).send('⚠️ Password must be 8–64 characters.');
      }

      if (/^\d+$/.test(password)) {
          return res.status(400).send('⚠️ Password cannot be all numbers.');
      }

      try {
          // Check if username or email already exists
          const userCheck = await pool.query(
              'SELECT * FROM user_login WHERE username = $1 OR email = $2',
              [username, email]
          );

          if (userCheck.rows.length > 0) {
              return res.status(409).send('⚠️ Username or email already taken.');
          }

          // Hash the password with bcrypt + pepper
          const hashedPassword = await bcrypt.hash(password + PEPPER, 10);

          // Start a transaction
          const client = await pool.connect();

          try {
              await client.query('BEGIN');

              // Insert into user_login
              await client.query(
                  'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES ($1, $2, $3, $4, $5)',
                  [username, email, hashedPassword, role, false]
              );

              // Insert into user_profile
              await client.query(
                  'INSERT INTO user_profile (username, first_name, surname) VALUES ($1, $2, $3)',
                  [username, first_name, surname]
              );

              await client.query('COMMIT');

              console.log('! User registered successfully:', username);
              return res.status(200).json({
                  message: '! Registration successful.',
                  role: role,
                  username: username
              });

          } catch (dbError) {
              await client.query('ROLLBACK');
              console.error('⚠️ Database error during registration:', dbError);
              return res.status(500).send('⚠️ Registration failed due to a database error.');
          } finally {
              client.release();
          }

      } catch (error) {
          console.error('⚠️ Server error during registration:', error);
          return res.status(500).send('⚠️ Server error during registration.');
      }
  };