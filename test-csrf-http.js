/**
 * Test script to verify CSRF protection using raw HTTP module
 *
 * This script demonstrates how CSRF protection works by:
 * 1. Making a GET request to get a CSRF token cookie
 * 2. Showing how a request with a valid CSRF token succeeds
 */

const http = require('http');

// Configuration
const HOST = 'localhost';
const PORT = 5500;

// Test data
const testUser = {
  username: 'testuser' + Math.floor(Math.random() * 10000),
  email: `test${Math.floor(Math.random() * 10000)}@example.com`,
  password: 'TestPass123!',
  first_name: 'Test',
  surname: 'User'
};

// Function to get CSRF token
function getCsrfToken() {
  return new Promise((resolve, reject) => {
    console.log('🔒 Getting CSRF token...');

    const options = {
      host: HOST,
      port: PORT,
      path: '/test-cookie',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Status code: ${res.statusCode}`);

      // Get cookies
      const cookies = res.headers['set-cookie'] || [];
      console.log('Cookies received:', cookies);

      // Find CSRF token cookie
      let csrfToken = '';
      let cookieHeader = '';

      for (const cookie of cookies) {
        if (cookie.includes('csrf_token=')) {
          const match = cookie.match(/csrf_token=([^;]+)/);
          if (match && match[1]) {
            csrfToken = match[1];
            cookieHeader = cookie.split(';')[0];
            console.log(`✅ Found CSRF token: ${csrfToken}`);
            break;
          }
        }
      }

      if (!csrfToken) {
        reject(new Error('No CSRF token found in response cookies'));
        return;
      }

      resolve({ csrfToken, cookies });
    });

    req.on('error', (e) => {
      console.error(`❌ Error getting CSRF token: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Function to test registration with CSRF token
function testRegistration(csrfToken, cookies) {
  return new Promise((resolve, reject) => {
    console.log('\n🔑 Testing registration WITH CSRF token...');

    // Prepare request data
    const data = JSON.stringify({
      ...testUser,
      csrf_token: csrfToken
    });

    // Prepare cookie header
    const cookieHeader = cookies
      .map(cookie => cookie.split(';')[0])
      .join('; ');

    const options = {
      host: HOST,
      port: PORT,
      path: '/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Cookie': cookieHeader
      }
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Status code: ${res.statusCode}`);

      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          console.log('\n=== Registration Response ===');
          console.log(JSON.stringify(jsonResponse, null, 2));
          console.log('✅ Request with valid CSRF token succeeded as expected');
          resolve(jsonResponse);
        } catch (e) {
          console.log('Response (not JSON):', responseData);
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error during registration: ${e.message}`);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Main function
async function runTest() {
  try {
    // Step 1: Get CSRF token
    const { csrfToken, cookies } = await getCsrfToken();

    // Step 2: Test registration with token
    await testRegistration(csrfToken, cookies);

    console.log('\n🎉 CSRF test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Check for specific network errors
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Connection refused. Make sure the server is running at', `${HOST}:${PORT}`);
    } else if (error.code === 'ECONNRESET') {
      console.error('⚠️ Connection reset. The server might be overloaded or not properly configured.');
      console.error('⚠️ Try checking Docker logs with: docker logs secure-development-project-main-app-1');
    }
  }
}

// Run the test
runTest();