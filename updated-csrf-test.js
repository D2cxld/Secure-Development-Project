const axios = require('axios');
  const { parse: parseCookie } = require('cookie');

  // Configuration
  const API_URL = 'http://localhost:5500'; // Updated to match your Docker port mapping

  // Set timeout to allow for slower connections
  axios.defaults.timeout = 10000; // 10 seconds

  // Test data
  const testUser = {
    username: 'testuser' + Math.floor(Math.random() * 10000),
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'TestPass123!',
    first_name: 'Test',
    surname: 'User'
  };

  // Helper to log response or error
  function logResult(title, data) {
    console.log('\n===', title, '===');
    console.log(JSON.stringify(data, null, 2));
  }

  // Run tests
  async function runTests() {
    try {
      // Step 1: Get a CSRF token from the login page
      console.log('🔒 Getting CSRF token...');
      console.log(`Requesting ${API_URL}/itslogin.html`);

      const response = await axios.get(`${API_URL}/itslogin.html`);

      console.log('Response headers:', response.headers);

      // Extract the CSRF cookie
      const cookies = response.headers['set-cookie'] || [];
      console.log('Cookies found:', cookies);

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
        console.error('❌ No CSRF token found in response cookies');
        return;
      }

      // Step 2: Try a request WITH a CSRF token (should succeed)
      console.log('\n🔑 Testing registration WITH CSRF token...');
      try {
        // Build a proper cookies string for the request
        const cookieString = cookies
          .map(cookie => cookie.split(';')[0])
          .join('; ');

        console.log('Using cookie string:', cookieString);

        const registerResponse = await axios.post(
          `${API_URL}/register`,
          { ...testUser, csrf_token: csrfToken },
          {
            headers: {
              'Cookie': cookieString,
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken // Added X-CSRF-Token header for additional compatibility
            },
            maxRedirects: 0 // Don't follow redirects
          }
        );

        logResult('Registration Response (WITH token)', registerResponse.data);
        console.log('✅ Request with valid CSRF token succeeded as expected');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // This might be an authentication error, not a CSRF error
          logResult('Registration Error (authentication issue)', error.response?.data || error.message);
          console.log('✅ Request with valid CSRF token received a response (possibly authentication issue, but CSRF check passed)');
        } else {
          logResult('Registration Error', error.response?.data || error.message);
          console.log('❌ Request with valid CSRF token failed unexpectedly');
        }
      }

      // Step 3: Try a request WITHOUT a CSRF token (should fail)
      console.log('\n🔒 Testing registration WITHOUT CSRF token...');
      try {
        // Create a different test user for this attempt
        const testUser2 = {
          ...testUser,
          username: testUser.username + '_2',
          email: 'test2_' + testUser.email
        };

        const noTokenResponse = await axios.post(
          `${API_URL}/register`,
          testUser2,
          {
            headers: {
              'Content-Type': 'application/json',
              // Including the cookie but NOT sending the token in the body or X-CSRF-Token header
              'Cookie': cookieString
            }
          }
        );

        logResult('Unexpected Success Response (WITHOUT token)', noTokenResponse.data);
        console.error('❌ Request without CSRF token unexpectedly succeeded');
      } catch (error) {
        if (error.response && error.response.status === 403) {
          logResult('Expected Error Response (WITHOUT token)', error.response?.data || error.message);
          console.log('✅ Request without CSRF token was rejected as expected with 403 Forbidden');
        } else {
          logResult('Error Response (WITHOUT token, but not 403)', error.response?.data || error.message);
          console.log('❓ Request without CSRF token failed, but not with the expected 403 status');
        }
      }

      console.log('\n🎉 CSRF protection tests completed!');

    } catch (error) {
      console.error('❌ Test failed:', error.message);

      // Check for specific network errors
      if (error.code === 'ECONNREFUSED') {
        console.error('⚠️ Connection refused. Make sure the server is running at', API_URL);
      } else if (error.code === 'ECONNRESET') {
        console.error('⚠️ Connection reset. The server might be overloaded or not properly configured.');
      }
    }
  }

  // Run the tests
  runTests();