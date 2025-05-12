/**
 * PostgreSQL Setup Script
 * 
 * This script:
 * 1. Creates the PostgreSQL database and schema
 * 2. Tests the email delivery system
 * 3. Adds initial admin whitelist entries
 * 
 * How to use:
 * 1. Make sure PostgreSQL is installed and running
 * 2. Update the .env file with your PostgreSQL credentials
 * 3. Run: node setup-postgres.js
 */

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

// Step 1: Create database if it doesn't exist
async function createDatabase() {
  console.log('🔄 Checking if database exists...');
  
  try {
    // Connect to postgres database to create our app database
    const client = await pool.connect();
    
    try {
      // Check if database exists
      const checkDb = await client.query(`
        SELECT 1 FROM pg_database WHERE datname = $1
      `, [process.env.DB_NAME || 'secureblog_roles_v2']);
      
      if (checkDb.rows.length === 0) {
        console.log(`🔄 Creating database "${process.env.DB_NAME || 'secureblog_roles_v2'}"...`);
        // Need to use template0 to avoid encoding issues
        await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'secureblog_roles_v2'} 
                            WITH TEMPLATE template0 ENCODING 'UTF8'`);
        console.log('✅ Database created successfully!');
      } else {
        console.log('✅ Database already exists!');
      }
    } finally {
      client.release();
    }
    
    // Create application database connection pool
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'secureblog_roles_v2',
      port: process.env.DB_PORT || 5432
    });
    
    return appPool;
  } catch (err) {
    console.error('❌ Error creating database:', err);
    throw err;
  }
}

// Step 2: Run the schema migration
async function runMigration(appPool) {
  console.log('🔄 Running database migration...');
  
  try {
    const client = await appPool.connect();
    try {
      const migrationSQL = fs.readFileSync(
        path.join(__dirname, 'db/migrations/001_create_postgres_tables.sql'), 
        'utf-8'
      ).replace(/\r/g, '');
      
      await client.query('BEGIN');
      await client.query(migrationSQL);
      await client.query('COMMIT');
      console.log('✅ Database migration completed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Migration failed:', err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error running migration:', err);
    throw err;
  }
}

// Step 3: Add initial admin to whitelist
async function addAdminWhitelist(appPool, email) {
  console.log(`🔄 Adding ${email} to admin whitelist...`);
  
  try {
    const client = await appPool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if email already exists in whitelist
      const checkEmail = await client.query(
        'SELECT 1 FROM admin_whitelist WHERE email = $1',
        [email]
      );
      
      if (checkEmail.rows.length > 0) {
        console.log('✅ Email already in whitelist');
      } else {
        await client.query(
          'INSERT INTO admin_whitelist (email, approved_by) VALUES ($1, $2)',
          [email, 'setup-script']
        );
        console.log('✅ Email added to admin whitelist');
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to add admin to whitelist:', err.message);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error adding admin to whitelist:', err);
    throw err;
  }
}

// Step 4: Test email delivery
async function testEmail() {
  console.log('🔄 Testing email delivery...');
  
  try {
    const emailService = require('./backend/utils/emailService');
    const code = Math.floor(100000 + Math.random() * 900000);
    
    await emailService('DDS_test_user1@outlook.com', code);
    console.log('✅ Test email sent successfully!');
  } catch (err) {
    console.error('❌ Email test failed:', err);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure EMAIL_USER and EMAIL_PASS are correctly set in .env');
    console.log('2. For Gmail, you need to use an App Password if 2FA is enabled');
    console.log('3. Check your network connectivity and firewall settings');
  }
}

// Main setup function
async function setup() {
  console.log('🚀 Starting PostgreSQL setup...');
  
  try {
    // Step 1: Create database
    const appPool = await createDatabase();
    
    // Step 2: Run migration
    await runMigration(appPool);
    
    // Step 3: Prompt user for admin email
    rl.question('Enter an email to add to admin whitelist: ', async (email) => {
      if (email && email.includes('@')) {
        await addAdminWhitelist(appPool, email);
      } else {
        console.log('❌ Invalid email. Skipping whitelist setup.');
      }
      
      // Step 4: Test email
      rl.question('Do you want to test email delivery? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          await testEmail();
        }
        
        console.log('\n✅ Setup completed!');
        console.log('\nNext steps:');
        console.log('1. Start the server with: node backend/server.js');
        console.log('2. Navigate to http://localhost:5500 in your browser');
        
        // Close the readline interface
        rl.close();
        
        // Close the connection pools
        await pool.end();
        await appPool.end();
      });
    });
  } catch (err) {
    console.error('❌ Setup failed:', err);
    process.exit(1);
  }
}

// Run the setup
setup();