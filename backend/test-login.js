const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with test user credentials...');
    const response = await axios({
      method: 'post',
      url: 'http://localhost:3006/auth/login',
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: 'user@example.com',
        password: 'password123'
      }
    });
    
    console.log('Login successful!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Login failed!');
    console.error('Status:', error.response?.status);
    console.error('Error message:', error.response?.data);
    
    // Additional debug info
    console.log('\nDetailed error information:');
    console.log('Request config:', JSON.stringify(error.config, null, 2));
    
    if (error.response) {
      console.log('Response headers:', JSON.stringify(error.response.headers, null, 2));
    }
    
    throw error;
  }
}

testLogin().catch(err => {
  console.error('Test failed with error:', err.message);
  process.exit(1);
}); 