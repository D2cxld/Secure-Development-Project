/**
      * CSRF Test Script for port 3000
      * Tests CSRF protection on the working local server
      */
     const axios = require('axios');
     // Configuration
     const BASE_URL = 'http://localhost:3000';
     const TEST_TIMEOUT = 10000; // 10 seconds
     … +135 lines (ctrl+r to expand)

● I've created an updated CSRF test script that focuses on testing port 3000 where your server is running successfully. Here's the full script for you to use:

  /**
   * CSRF Test Script for port 3000
   * Tests CSRF protection on the working local server
   */

  const axios = require('axios');

  // Configuration
  const BASE_URL = 'http://localhost:3000';
  const TEST_TIMEOUT = 10000; // 10 seconds

  // Generate random test data
  const randomId = Math.floor(Math.random() * 10000);
  const testUser = {
    username: `testuser${randomId}`,
    email: `test${randomId}@example.com`,
    password: 'TestPass123!',
    first_name: 'Test',
    surname: 'User'
  };

  console.log('=== CSRF Protection Test (Port 3000) ===');
  console.log('Test user:', testUser.username);

  async function runTest() {
    try {
      // Step 1: Get CSRF token from login page
      console.log('\n🔍 Requesting login page to get CSRF token...');
      const loginResponse = await axios.get(`${BASE_URL}/itslogin.html`, {
        timeout: TEST_TIMEOUT
      });

      console.log('✅ Successfully accessed login page');

      // Extract CSRF token from cookies
      const cookies = loginResponse.headers['set-cookie'] || [];
      console.log(`Received ${cookies.length} cookies`);

      let csrfToken = '';
      for (const cookie of cookies) {
        if (cookie.includes('csrf_token=')) {
          const parts = cookie.split(';')[0].split('=');
          if (parts.length >= 2) {
            csrfToken = parts[1];
            console.log('✅ Found CSRF token:', csrfToken);
            break;
          }
        }
      }

      if (!csrfToken) {
        console.error('❌ No CSRF token found in cookies!');
        return;
      }

      // Create the cookie string for subsequent requests
      const cookieString = cookies.join('; ');

      // Step 2: Test registration WITH CSRF token
      console.log('\n🔐 Testing registration WITH CSRF token...');
      try {
        const registrationResponse = await axios.post(
          `${BASE_URL}/register`,
          { ...testUser, csrf_token: csrfToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieString,
              'X-CSRF-Token': csrfToken
            },
            timeout: TEST_TIMEOUT
          }
        );

        console.log('✅ Registration WITH token succeeded');
        console.log('Status:', registrationResponse.status);
        console.log('Response:', registrationResponse.data);
      } catch (regError) {
        // Still consider it a success if we get a response (might be validation error)
        if (regError.response && regError.response.status !== 403) {
          console.log('✅ Registration WITH token received response (not 403)');
          console.log('Status:', regError.response.status);
          console.log('Response:', regError.response.data);
        } else {
          console.error('❌ Registration WITH token failed unexpectedly');
          console.error('Error:', regError.message);
          if (regError.response) {
            console.error('Status:', regError.response.status);
            console.error('Response:', regError.response.data);
          }
        }
      }

      // Step 3: Test registration WITHOUT CSRF token
      console.log('\n⚠️ Testing registration WITHOUT CSRF token...');
      try {
        // Create a different test user
        const testUser2 = {
          ...testUser,
          username: `${testUser.username}_no_token`,
          email: `no_token_${testUser.email}`
        };

        const noTokenResponse = await axios.post(
          `${BASE_URL}/register`,
          testUser2, // No CSRF token in body
          {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': cookieString
              // No X-CSRF-Token header
            },
            timeout: TEST_TIMEOUT
          }
        );

        console.error('❌ SECURITY ISSUE: Registration WITHOUT token succeeded!');
        console.error('Status:', noTokenResponse.status);
        console.error('Response:', noTokenResponse.data);
      } catch (noTokenError) {
        if (noTokenError.response && noTokenError.response.status === 403) {
          console.log('✅ CSRF protection working! Registration WITHOUT token was correctly rejected with 403 Forbidden');
          console.log('Response:', noTokenError.response.data);
        } else {
          console.log('❓ Registration WITHOUT token failed, but not with the expected 403 status');
          console.log('Error:', noTokenError.message);
          if (noTokenError.response) {
            console.log('Status:', noTokenError.response.status);
            console.log('Response:', noTokenError.response.data);
          }
        }
      }

      console.log('\n🏁 CSRF Test Complete');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('⚠️ Connection refused. Make sure the server is running on port 3000');
      }
    }
  }

  // Run the test
  runTest();