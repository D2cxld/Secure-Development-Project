/**
   * Complete Form Submission and Authentication Test
   *
   * This script tests the following:
   * 1. User registration
   * 2. User login
   * 3. Admin registration (via whitelist)
   * 4. Admin login with 2FA
   * 5. Role-based access control
   */

  const axios = require('axios');
  const { Pool } = require('pg');
  const bcrypt = require('bcrypt');
  const path = require('path');
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

  console.log('DB Config:', {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '****' : undefined, // Don't print the actual password
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
  });

  // Database connection
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'secureblog_roles_v2',
    port: parseInt(process.env.DB_PORT) || 5500
  });

  // Configuration
  const BASE_URL = 'http://localhost:3000'; // As specified in server.js (const PORT = process.env.PORT || 3000)
  const TEST_TIMEOUT = 10000; // 10 seconds

  // Test users
  const randomId = Math.floor(Math.random() * 10000);
  const testUser = {
    username: `testuser${randomId}`,
    email: `testuser${randomId}@example.com`,
    password: 'TestPass123!',
    first_name: 'Test',
    surname: 'User'
  };

  const testAdmin = {
    username: `testadmin${randomId}`,
    email: `testadmin${randomId}@example.com`,
    password: 'AdminPass123!',
    first_name: 'Admin',
    surname: 'User'
  };

  // Store cookies and tokens
  let userCookies = '';
  let adminCookies = '';
  let csrfToken = '';
  let twoFACode = '';

  async function runTests() {
    console.log('===== COMPREHENSIVE FORM AND AUTHENTICATION TESTING =====');

    try {
      const client = await pool.connect();
      console.log('✅ Connected to database');

      // Initial cleanup
      try {
        console.log('\n🔄 Cleaning up test users...');
        await client.query('BEGIN');
        await client.query('DELETE FROM user_profile WHERE username = $1 OR username = $2',
          [testUser.username, testAdmin.username]);
        await client.query('DELETE FROM user_login WHERE username = $1 OR username = $2',
          [testUser.username, testAdmin.username]);
        await client.query('COMMIT');
        console.log('✅ Cleanup successful');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during cleanup:', error.message);
      }

      // Step 1: Add admin email to whitelist
      try {
        console.log('\n🔄 Adding admin email to whitelist...');
        await client.query('INSERT INTO admin_whitelist (email) VALUES ($1)', [testAdmin.email]);
        console.log(`✅ Added ${testAdmin.email} to admin whitelist`);
      } catch (error) {
        console.error('❌ Error adding to whitelist:', error.message);
      }

      // Step 2: Test regular user registration via form submission
      console.log('\n🔄 TEST 1: REGULAR USER REGISTRATION');

      try {
        // Get CSRF token first (from login page)
        console.log('🔄 Getting CSRF token...');
        const tokenResponse = await axios.get(`${BASE_URL}/itslogin.html`);
        const cookies = tokenResponse.headers['set-cookie'] || [];

        const cookieString = cookies.join('; ');
        userCookies = cookieString;

        // Extract CSRF token from cookies
        for (const cookie of cookies) {
          if (cookie.includes('csrf_token=')) {
            csrfToken = cookie.split('=')[1].split(';')[0];
            console.log('✅ Found CSRF token:', csrfToken);
            break;
          }
        }

        // Now register the user
        console.log('🔄 Submitting registration form for regular user...');
        const regResponse = await axios.post(
          `${BASE_URL}/register`,
          {
            ...testUser,
            csrf_token: csrfToken
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieString,
              'X-CSRF-Token': csrfToken
            }
          }
        );

        console.log('✅ User registration response:', regResponse.status, regResponse.data);
        console.log(`✅ User "${testUser.username}" registered successfully`);
      } catch (error) {
        console.error('❌ Error during user registration:', error.message);
        if (error.response) {
          console.error('Response:', error.response.status, error.response.data);
        }
      }

      // Step 3: Test user login
      console.log('\n🔄 TEST 2: USER LOGIN');

      try {
        console.log('🔄 Attempting login with user credentials...');
        const loginResponse = await axios.post(
          `${BASE_URL}/login`,
          {
            username: testUser.username,
            password: testUser.password,
            csrf_token: csrfToken
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': userCookies,
              'X-CSRF-Token': csrfToken
            }
          }
        );

        console.log('✅ User login response:', loginResponse.status);
        console.log('✅ Login data:', loginResponse.data);

        // Update cookies from login response
        if (loginResponse.headers['set-cookie']) {
          userCookies = loginResponse.headers['set-cookie'].join('; ');
        }

      } catch (error) {
        console.error('❌ Error during user login:', error.message);
        if (error.response) {
          console.error('Response:', error.response.status, error.response.data);
        }
      }

      // Step 4: Test admin registration
      console.log('\n🔄 TEST 3: ADMIN REGISTRATION');

      try {
        // Register the admin user
        console.log('🔄 Submitting registration form for admin user...');
        const adminRegResponse = await axios.post(
          `${BASE_URL}/register`,
          {
            ...testAdmin,
            csrf_token: csrfToken
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': userCookies,
              'X-CSRF-Token': csrfToken
            }
          }
        );

        console.log('✅ Admin registration response:', adminRegResponse.status);
        console.log('✅ Admin registration data:', adminRegResponse.data);

        // Check for 2FA requirement
        if (adminRegResponse.data.needs2FA) {
          console.log('✅ Admin registration requires 2FA verification as expected');

          // Get 2FA code from database (this is for testing only)
          const twoFAResult = await client.query(
            'SELECT verification_code FROM temp_admin_registration WHERE username = $1',
            [testAdmin.username]
          );

          if (twoFAResult.rows.length > 0) {
            twoFACode = twoFAResult.rows[0].verification_code;
            console.log('✅ Retrieved 2FA code from database:', twoFACode);

            // Verify 2FA
            console.log('🔄 Verifying admin with 2FA code...');
            const verifyResponse = await axios.post(
              `${BASE_URL}/2fa/verify`,
              {
                username: testAdmin.username,
                code: twoFACode,
                csrf_token: csrfToken
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': userCookies,
                  'X-CSRF-Token': csrfToken
                }
              }
            );

            console.log('✅ 2FA verification response:', verifyResponse.status);
            console.log('✅ Admin account created and verified!');
          } else {
            console.error('❌ Could not find 2FA code in database');
          }
        }
      } catch (error) {
        console.error('❌ Error during admin registration:', error.message);
        if (error.response) {
          console.error('Response:', error.response.status, error.response.data);
        }
      }

      // Step 5: Test admin login with 2FA
      console.log('\n🔄 TEST 4: ADMIN LOGIN WITH 2FA');

      try {
        console.log('🔄 Attempting login with admin credentials...');
        const adminLoginResponse = await axios.post(
          `${BASE_URL}/login`,
          {
            username: testAdmin.username,
            password: testAdmin.password,
            csrf_token: csrfToken
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': userCookies,
              'X-CSRF-Token': csrfToken
            }
          }
        );

        console.log('✅ Admin login response:', adminLoginResponse.status);
        console.log('✅ Admin login data:', adminLoginResponse.data);

        // Handle 2FA if needed
        if (adminLoginResponse.data.needs2FA) {
          console.log('✅ Admin login requires 2FA as expected');

          // Get 2FA code from database (this is for testing only)
          const twoFAResult = await client.query(
            'SELECT verification_code FROM temp_admin_registration WHERE username = $1 OR email = $2',
            [testAdmin.username, testAdmin.email]
          );

          if (twoFAResult.rows.length > 0) {
            twoFACode = twoFAResult.rows[0].verification_code;
            console.log('✅ Retrieved 2FA code from database:', twoFACode);

            // Verify 2FA for login
            console.log('🔄 Verifying admin login with 2FA code...');
            const verifyLoginResponse = await axios.post(
              `${BASE_URL}/login/verify-2fa`,
              {
                username: testAdmin.username,
                code: twoFACode,
                csrf_token: csrfToken
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': userCookies,
                  'X-CSRF-Token': csrfToken
                }
              }
            );

            console.log('✅ 2FA login verification response:', verifyLoginResponse.status);
            console.log('✅ Admin logged in successfully with 2FA!');

            // Update cookies from 2FA response
            if (verifyLoginResponse.headers['set-cookie']) {
              adminCookies = verifyLoginResponse.headers['set-cookie'].join('; ');
            }
          } else {
            console.error('❌ Could not find 2FA code in database');
          }
        } else {
          console.log('⚠️ WARNING: Admin login did not require 2FA');

          // Update cookies from login response
          if (adminLoginResponse.headers['set-cookie']) {
            adminCookies = adminLoginResponse.headers['set-cookie'].join('; ');
          }
        }
      } catch (error) {
        console.error('❌ Error during admin login:', error.message);
        if (error.response) {
          console.error('Response:', error.response.status, error.response.data);
        }
      }

      // Step 6: Test role-based access
      console.log('\n🔄 TEST 5: ROLE-BASED ACCESS CONTROL');

      // Test user access to user dashboard
      try {
        console.log('🔄 Testing user access to user dashboard...');
        const userDashboardResponse = await axios.get(
          `${BASE_URL}/dashboard.html`,
          {
            headers: {
              'Cookie': userCookies
            }
          }
        );

        console.log('✅ User can access user dashboard:', userDashboardResponse.status);
      } catch (error) {
        console.error('❌ User cannot access user dashboard:', error.message);
      }

      // Test user access to admin dashboard (should fail)
      try {
        console.log('🔄 Testing user access to admin dashboard (should be denied)...');
        const userAdminAccessResponse = await axios.get(
          `${BASE_URL}/admin/dashboard.html`,
          {
            headers: {
              'Cookie': userCookies
            }
          }
        );

        console.log('⚠️ WARNING: User could access admin dashboard:', userAdminAccessResponse.status);
      } catch (error) {
        console.log('✅ User correctly denied access to admin dashboard');
      }

      // Test admin access to admin dashboard
      try {
        console.log('🔄 Testing admin access to admin dashboard...');
        const adminDashboardResponse = await axios.get(
          `${BASE_URL}/admin/dashboard.html`,
          {
            headers: {
              'Cookie': adminCookies
            }
          }
        );

        console.log('✅ Admin can access admin dashboard:', adminDashboardResponse.status);
      } catch (error) {
        console.error('❌ Admin cannot access admin dashboard:', error.message);
      }

      console.log('\n===== FORM AND AUTHENTICATION TESTING COMPLETE =====');
      console.log('\nTest credentials for manual testing:');
      console.log(`Regular User: ${testUser.username} / ${testUser.password}`);
      console.log(`Admin User: ${testAdmin.username} / ${testAdmin.password}`);

      client.release();
    } catch (error) {
      console.error('❌ Test error:', error.message);
    } finally {
      await pool.end();
    }
  }

  runTests();