/**
   * Simple Registration Test
   *
   * Tests the registration form submission without database operations
   */

  const axios = require('axios');
  require('dotenv').config();

  // Configuration
  const BASE_URL = 'http://localhost:3000';

  // Test user
  const randomId = Math.floor(Math.random() * 10000);
  const testUser = {
    username: `testuser${randomId}`,
    email: `testuser${randomId}@example.com`,
    password: 'TestPass123!',
    first_name: 'Test',
    surname: 'User'
  };

  async function testRegistration() {
    console.log('===== TESTING USER REGISTRATION =====');
    console.log('Test user:', testUser);
    console.log('Base URL:', BASE_URL);

    try {
      // Step 1: Get CSRF token from login page
      console.log('\n🔄 Getting CSRF token...');

      try {
        const tokenResponse = await axios.get(`${BASE_URL}/itslogin.html`, {
          timeout: 5000 // 5 second timeout
        });

        console.log('✅ Got response from server');
        console.log('Response status:', tokenResponse.status);

        const cookies = tokenResponse.headers['set-cookie'] || [];
        console.log('Cookies received:', cookies.length > 0 ? 'Yes' : 'No');

        let csrfToken = '';
        let cookieString = '';

        if (cookies.length > 0) {
          cookieString = cookies.join('; ');

          // Extract CSRF token from cookies
          for (const cookie of cookies) {
            if (cookie.includes('csrf_token=')) {
              csrfToken = cookie.split('=')[1].split(';')[0];
              console.log('✅ Found CSRF token:', csrfToken);
              break;
            }
          }

          if (!csrfToken) {
            console.log('⚠️ No CSRF token found in cookies');
            console.log('Cookies:', cookies);
          }
        } else {
          console.log('⚠️ No cookies received from server');
        }

        // Step 2: Submit registration
        console.log('\n🔄 Submitting registration form...');

        const registrationData = {
          ...testUser
        };

        // Add CSRF token if available
        if (csrfToken) {
          registrationData.csrf_token = csrfToken;
        }

        const headers = {
          'Content-Type': 'application/json'
        };

        // Add cookies if available
        if (cookieString) {
          headers['Cookie'] = cookieString;
        }

        // Add CSRF token header if available
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }

        console.log('Request headers:', headers);
        console.log('Registration data:', registrationData);

        const regResponse = await axios.post(
          `${BASE_URL}/register`,
          registrationData,
          {
            headers,
            timeout: 5000 // 5 second timeout
          }
        );

        console.log('\n✅ Registration response status:', regResponse.status);
        console.log('✅ Registration response data:', regResponse.data);
        console.log(`✅ User "${testUser.username}" registered successfully`);

      } catch (requestError) {
        console.error('❌ Request error:', requestError.message);

        if (requestError.code === 'ECONNREFUSED') {
          console.error('⚠️ Server connection refused. Is the server running on port 3000?');
        }

        if (requestError.response) {
          console.error('Response status:', requestError.response.status);
          console.error('Response data:', requestError.response.data);
        } else {
          console.error('No response received from server');
        }
      }

    } catch (error) {
      console.error('\n❌ Error during registration test:');
      console.error('Error message:', error.message);
    }

    console.log('\n===== REGISTRATION TESTING COMPLETE =====');
  }

  testRegistration();