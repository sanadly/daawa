const http = require('http');

// Configuration
const HOST = 'localhost';
const PORT = 3002;
const TEST_EMAIL = 'user@example.com';
const TEST_PASSWORD = 'testpassword123';

// Function to make a POST request
function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    // Create the request data
    const postData = JSON.stringify(data);
    
    // Configure the request options
    const options = {
      hostname: HOST,
      port: PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log(`Making POST request to http://${HOST}:${PORT}${path}`);
    console.log(`Request payload: ${postData}`);
    
    // Create and send the request
    const req = http.request(options, (res) => {
      console.log(`Response status: ${res.statusCode}`);
      console.log(`Response headers: ${JSON.stringify(res.headers)}`);
      
      let responseData = '';
      
      // Collect the response data
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      // Process the complete response
      res.on('end', () => {
        console.log(`Response body: ${responseData}`);
        
        try {
          // Try to parse as JSON if possible
          const jsonResponse = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: jsonResponse });
        } catch (error) {
          // If not valid JSON, return as string
          resolve({ statusCode: res.statusCode, headers: res.headers, body: responseData });
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      console.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    // Send the request data
    req.write(postData);
    req.end();
  });
}

// Test the login endpoint
async function testLogin() {
  console.log('\n=== Testing Regular Login Endpoint ===\n');
  
  try {
    const loginResponse = await makePostRequest('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('\nLogin test completed\n');
    
    return loginResponse;
  } catch (error) {
    console.error('Login test failed:', error.message);
    return null;
  }
}

// Test the direct login endpoint
async function testDirectLogin() {
  console.log('\n=== Testing Direct Login Endpoint ===\n');
  
  try {
    const loginResponse = await makePostRequest('/auth/login-direct', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('\nDirect login test completed\n');
    
    return loginResponse;
  } catch (error) {
    console.error('Direct login test failed:', error.message);
    return null;
  }
}

// Test the health endpoint to verify connection
async function testHealth() {
  console.log('\n=== Testing Health Endpoint ===\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/health',
      method: 'GET'
    };
    
    console.log(`Making GET request to http://${HOST}:${PORT}/health`);
    
    const req = http.request(options, (res) => {
      console.log(`Response status: ${res.statusCode}`);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Response body: ${responseData}`);
        
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, body: jsonResponse });
        } catch (error) {
          resolve({ statusCode: res.statusCode, body: responseData });
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Health check error: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

// Run all tests
async function runAllTests() {
  try {
    // First, test the health endpoint to verify server is running
    await testHealth();
    
    // Test the regular login endpoint
    await testLogin();
    
    // Test the direct login endpoint
    await testDirectLogin();
    
    console.log('\n=== All tests completed ===\n');
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Run the tests
runAllTests(); 