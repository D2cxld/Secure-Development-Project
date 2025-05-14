/**
 * Test script to verify 2FA functionality
 * 
 * This script demonstrates how the 2FA flow works by:
 * 1. Registering an admin user (assuming the email is whitelisted)
 * 2. Attempting login (which should trigger 2FA)
 * 3. Completing the 2FA verification process
 * 
 * IMPORTANT: Before running this test, ensure an admin email is whitelisted
 * You can use: node db-explorer.js to check admin_whitelist table
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
const API_URL = 'http://localhost:5500'; // Using port 5500 as per Docker configuration

// Helper to log response or error
function logResult(title, data) {
  console.log('\n===', title, '===');
  console.log(JSON.stringify(data, null, 2));
}

// Helper to get CSRF token from response
async function getCsrfToken() {
  // Use the test-cookie endpoint to get a CSRF token
  const response = await axios.get(`${API_URL}/test-cookie`);
  const cookies = response.headers['set-cookie'] || [];
  let csrfToken = '';
  let cookieHeader = '';
  
  for (const cookie of cookies) {
    if (cookie.includes('csrf_token=')) {
      // Extract the token part
      const parts = cookie.split(';')[0].split('=');
      if (parts.length >= 2) {
        csrfToken = parts[1];
        cookieHeader = cookie.split(';')[0];
        break;
      }
    }
  }
  
  return { 
    token: csrfToken, 
    cookieHeader: cookieHeader
  };
}

// Helper to prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run tests
async function runTests() {
  try {
    // Get CSRF token
    console.log('🔒 Getting CSRF token...');
    const { token: csrfToken, cookieHeader } = await getCsrfToken();
    console.log('✅ Got CSRF token:', csrfToken);
    
    // Get admin email from user input
    const adminEmail = await prompt('\n📧 Enter a whitelisted admin email: ');
    
    // Step 1: Register an admin user
    console.log('\n👤 Registering admin user...');
    
    const adminUser = {
      username: 'testadmin' + Math.floor(Math.random() * 10000),
      email: adminEmail,
      password: 'SecurePass123!',
      first_name: 'Test',
      surname: 'Admin',
      csrf_token: csrfToken
    };
    
    try {
      // Include CSRF token in the request body
      const registerData = {
        ...adminUser,
        csrf_token: csrfToken
      };
      
      const registerResponse = await axios.post(
        `${API_URL}/register`, 
        registerData,
        { 
          headers: { 
            'Cookie': cookieHeader,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      logResult('Admin Registration Response', registerResponse.data);
      
      if (registerResponse.data.needs2FA) {
        console.log('✅ 2FA required as expected for admin registration');
        
        // Get verification code from user
        const verificationCode = await prompt('\n🔑 Enter the verification code (check console output): ');
        
        // Get fresh CSRF token
        const { token: newCsrfToken, cookieHeader: newCookieHeader } = await getCsrfToken();
        
        // Verify 2FA code
        console.log('\n🔐 Verifying 2FA code...');
        const verifyResponse = await axios.post(
          `${API_URL}/2fa/verify`,
          { 
            username: adminUser.username, 
            code: verificationCode,
            csrf_token: newCsrfToken
          },
          { 
            headers: { 
              'Cookie': newCookieHeader,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        logResult('2FA Verification Response', verifyResponse.data);
        console.log('✅ Admin registration with 2FA completed successfully');
      } else {
        console.log('❌ 2FA was not required for admin registration');
      }
    } catch (error) {
      logResult('Registration Error', error.response?.data || error.message);
    }
    
    // Step 2: Test login with 2FA
    console.log('\n🔑 Testing admin login (should require 2FA)...');
    
    // Get fresh CSRF token
    const { token: loginCsrfToken, cookieHeader: loginCookieHeader } = await getCsrfToken();
    
    try {
      const loginResponse = await axios.post(
        `${API_URL}/login`,
        { 
          username: adminUser.username, 
          password: adminUser.password,
          csrf_token: loginCsrfToken 
        },
        { 
          headers: { 
            'Cookie': loginCookieHeader,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      logResult('Admin Login Response', loginResponse.data);
      
      if (loginResponse.data.needs2FA) {
        console.log('✅ 2FA required for admin login as expected');
        
        // Get verification code from user
        const loginVerificationCode = await prompt('\n🔑 Enter the login verification code (check console output): ');
        
        // Get fresh CSRF token
        const { token: verify2CsrfToken, cookieHeader: verify2CookieHeader } = await getCsrfToken();
        
        // Verify 2FA code for login
        console.log('\n🔐 Verifying login 2FA code...');
        const verify2Response = await axios.post(
          `${API_URL}/login/verify-2fa`,
          { 
            username: adminUser.username, 
            code: loginVerificationCode,
            preAuthToken: loginResponse.data.preAuthToken,
            csrf_token: verify2CsrfToken
          },
          { 
            headers: { 
              'Cookie': verify2CookieHeader,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        logResult('Login 2FA Verification Response', verify2Response.data);
        console.log('✅ Admin login with 2FA completed successfully');
      } else {
        console.log('❌ 2FA was not required for admin login');
      }
    } catch (error) {
      logResult('Login Error', error.response?.data || error.message);
    }
    
    console.log('\n🎉 2FA tests completed!');
    rl.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    rl.close();
  }
}

// Run the tests
runTests();