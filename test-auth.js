const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:8000'; // Change if using a different port
let authToken = '';

// Test user credentials
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'TestPass123!',
  first_name: 'Test', // Changed from firstname to first_name
  surname: 'User'
};

// Helper to log response or error
const logResult = (title, data) => {
  console.log('\n===', title, '===');
  console.log(JSON.stringify(data, null, 2));
};

// Run tests
async function runTests() {
  try {
    // Step 1: Register a test user
    console.log('🔑 Testing user registration...');
    try {
      const registerResponse = await axios.post(`${API_URL}/register`, testUser);
      logResult('Registration Response', registerResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('User already exists (this is OK for testing)');
      } else {
        logResult('Registration Error', error.response?.data || error.message);
      }
    }

    // Step 2: Login
    console.log('🔑 Testing login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/login`, {
        username: testUser.username,
        password: testUser.password
      });
      
      logResult('Login Response', loginResponse.data);
      authToken = loginResponse.data.token;
      
      if (!authToken) {
        throw new Error('No token received');
      }
      
      console.log('✅ Login successful, received token');
    } catch (error) {
      logResult('Login Error', error.response?.data || error.message);
      process.exit(1);
    }

    // Step 3: Test protected route
    console.log('🔒 Testing protected route...');
    try {
      const profileResponse = await axios.get(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      logResult('Profile Response', profileResponse.data);
      console.log('✅ Successfully accessed protected route');
    } catch (error) {
      logResult('Protected Route Error', error.response?.data || error.message);
    }

    // Step 4: Test admin route (should fail for regular user)
    console.log('👑 Testing admin-protected route...');
    try {
      const adminResponse = await axios.get(`${API_URL}/api/user/all`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      logResult('Admin Route Response', adminResponse.data);
    } catch (error) {
      logResult('Admin Route Error', error.response?.data || error.message);
      console.log('✅ Admin route correctly rejected non-admin user');
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();