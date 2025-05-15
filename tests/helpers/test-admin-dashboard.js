/**
 * Admin Dashboard Test Script
 *
 * This script tests the admin dashboard functionality by:
 * 1. Registering an admin user with 2FA
 * 2. Completing 2FA verification
 * 3. Logging in to the admin dashboard
 * 4. Testing admin API endpoints
 */

const axios = require('axios');
const { parse: parseCookie } = require('cookie');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = 'http://localhost:5500';

// Helper functions
function logResult(title, data) {
  console.log('\n===', title, '===');
  console.log(JSON.stringify(data, null, 2));
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function getCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}/test-cookie`);
    const cookies = response.headers['set-cookie'] || [];
    let csrfToken = '';
    let cookieHeader = '';

    for (const cookie of cookies) {
      if (cookie.includes('csrf_token=')) {
        const parts = cookie.split(';')[0].split('=');
        if (parts.length >= 2) {
          csrfToken = parts[1];
          cookieHeader = cookie.split(';')[0];
          break;
        }
      }
    }

    return { token: csrfToken, cookieHeader };
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    throw error;
  }
}

async function testDashboardAPI(authToken) {
  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error testing dashboard API:', error.response?.data || error.message);
    throw error;
  }
}

async function testAddToWhitelist(authToken, email) {
  try {
    const { token: csrfToken, cookieHeader } = await getCsrfToken();

    const response = await axios.post(
      `${API_URL}/api/admin/whitelist`,
      {
        email,
        csrf_token: csrfToken
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': cookieHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error adding to whitelist:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('🧪 Starting Admin Dashboard Test');

    // Step 1: Get admin credentials
    console.log('\n📋 Please provide admin user details:');
    const username = await prompt('Username: ');
    const password = await prompt('Password: ');

    // Step 2: Login as admin
    console.log('\n🔑 Logging in as admin...');
    const { token: loginCsrfToken, cookieHeader: loginCookieHeader } = await getCsrfToken();

    const loginResponse = await axios.post(
      `${API_URL}/login`,
      {
        username,
        password,
        csrf_token: loginCsrfToken
      },
      {
        headers: {
          'Cookie': loginCookieHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    logResult('Login Response', loginResponse.data);

    // If 2FA is required
    let authToken = loginResponse.data.token;

    if (loginResponse.data.needs2FA) {
      console.log('\n🔒 2FA required for this admin user');
      const verificationCode = await prompt('\n🔑 Enter the verification code (check console output): ');

      const { token: verifyCsrfToken, cookieHeader: verifyCookieHeader } = await getCsrfToken();

      const verifyResponse = await axios.post(
        `${API_URL}/login/verify-2fa`,
        {
          username,
          code: verificationCode,
          preAuthToken: loginResponse.data.preAuthToken,
          csrf_token: verifyCsrfToken
        },
        {
          headers: {
            'Cookie': verifyCookieHeader,
            'Content-Type': 'application/json'
          }
        }
      );

      logResult('2FA Verification Response', verifyResponse.data);
      authToken = verifyResponse.data.token;

      if (!authToken) {
        throw new Error('No auth token received after 2FA verification');
      }
    }

    // Step 3: Test dashboard API
    console.log('\n📊 Testing Admin Dashboard API...');
    const dashboardData = await testDashboardAPI(authToken);
    logResult('Dashboard Data', dashboardData);

    // Step 4: Test adding to whitelist
    const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    console.log(`\n📧 Testing adding email to whitelist: ${testEmail}`);

    const whitelistResponse = await testAddToWhitelist(authToken, testEmail);
    logResult('Whitelist Response', whitelistResponse);

    // Step 5: Verify addition to whitelist
    console.log('\n🔍 Verifying whitelist addition...');
    const updatedDashboardData = await testDashboardAPI(authToken);

    const addedEmail = updatedDashboardData.whitelist.find(entry => entry.email === testEmail);
    if (addedEmail) {
      console.log(`✅ Email ${testEmail} successfully added to whitelist!`);
    } else {
      console.log(`❌ Failed to find ${testEmail} in the whitelist`);
    }

    console.log('\n🎉 Admin Dashboard Tests Completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the test
runTest();