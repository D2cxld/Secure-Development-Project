  const { Pool } = require('pg');
  const bcrypt = require('bcryptjs');
  const path = require('path');
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

  console.log('Resolved .env path:', path.resolve(__dirname, '../../.env'));
  console.log('Database config:', {
    host: process.env.DB_HOST || 'default',
    user: process.env.DB_USER || 'default',
    password: process.env.DB_PASSWORD ? '****' : 'not set',
    database: process.env.DB_NAME || 'default',
    port: process.env.DB_PORT || 'default'
  });

  // Define superadmin
  const USERNAME = 'superadmin';
  const EMAIL = 'superadmin@example.com';
  const PASSWORD = 'Secure123!';
  const PEPPER = process.env.PEPPER || 's3cR3t$Pepper!';

  // Create database connection
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
    port: parseInt(process.env.DB_PORT) || 5500
  });

  async function createSuperAdmin() {
    console.log('🔄 Starting superadmin creation process...');

    try {
      // Hash password
      const passwordHash = await bcrypt.hash(PASSWORD + PEPPER, 10);
      console.log('✅ Password hashed successfully');

      // Begin transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Check if user already exists
        const checkQuery = 'SELECT * FROM user_login WHERE username = $1 OR email = $2';
        const checkResult = await client.query(checkQuery, [USERNAME, EMAIL]);

        if (checkResult.rows.length > 0) {
          console.log('⚠️ User already exists, updating to superadmin...');

          // Update to superadmin
          await client.query(
            "UPDATE user_login SET role = 'superadmin' WHERE username = $1 OR email = $2",
            [USERNAME, EMAIL]
          );
        } else {
          console.log('🔄 Creating new superadmin user...');

          // Insert user_login
          await client.query(
            'INSERT INTO user_login (username, email, password_hash, role, uses_2fa) VALUES ($1, $2, $3, $4, $5)',
            [USERNAME, EMAIL, passwordHash, 'superadmin', false]
          );

          // Insert user_profile
          await client.query(
            'INSERT INTO user_profile (username, first_name, surname) VALUES ($1, $2, $3)',
            [USERNAME, 'Super', 'Admin']
          );
        }

        await client.query('COMMIT');
        console.log('✅ Superadmin created/updated successfully!');
        console.log('\nCredentials:');
        console.log(`Username: ${USERNAME}`);
        console.log(`Email: ${EMAIL}`);
        console.log(`Password: ${PASSWORD}`);

      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction error:', error);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      pool.end();
    }
  }

  createSuperAdmin();

