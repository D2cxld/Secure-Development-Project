/**
 * Direct CSRF Test Script
 *
 * This script tests CSRF protection by directly testing the API endpoints.
 */

const axios = require('axios');
const { parse: parseCookie } = require('cookie');

// Configuration
const API_URL = 'http://localhost:5500';

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
    // Step 1: Get a CSRF token from the test cookie endpoint
    console.log('🔒 Getting CSRF token...');
    const response = await axios.get(`${API_URL}/test-cookie`);

    console.log('Response headers:', response.headers);

    // Extract the CSRF cookie
    const cookies = response.headers['set-cookie'] || [];
    console.log('Cookies found:', cookies);

    let csrfToken = '';
    let cookieString = '';

    for (const cookie of cookies) {
      if (cookie.includes('csrf_token=')) {
        const parts = cookie.split(';')[0].split('=');
        if (parts.length >= 2) {
          csrfToken = parts[1];
          cookieString = cookie.split(';')[0];
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
      const registerResponse = await axios.post(
        `${API_URL}/register`,
        { ...testUser, csrf_token: csrfToken },
        {
          headers: {
            'Cookie': cookieString,
            'Content-Type': 'application/json'
          }
        }
      );

      logResult('Registration Response (WITH token)', registerResponse.data);
      console.log('✅ Request with valid CSRF token succeeded as expected');
    } catch (error) {
      logResult('Registration Error', error.response?.data || error.message);
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

      await axios.post(`${API_URL}/register`, testUser2);
      console.error('❌ Request without CSRF token unexpectedly succeeded');
    } catch (error) {
      logResult('Expected Error Response (WITHOUT token)', error.response?.data || error.message);
      console.log('✅ Request without CSRF token was rejected as expected');
    }

    console.log('\n🎉 CSRF protection tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Check for specific network errors
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Connection refused. Make sure the server is running at', API_URL);
    } else if (error.code === 'ECONNRESET') {
      console.error('⚠️ Connection reset. The server might be overloaded or not properly configured.');
      console.error('⚠️ Try checking Docker logs with: docker logs secure-development-project-main-app-1');
    }
  }
}

// Run the tests
runTests();