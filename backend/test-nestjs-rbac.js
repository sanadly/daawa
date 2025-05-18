// For node-fetch v2 (CommonJS)
const fetch = require('node-fetch');

// Base URL of our NestJS API
const API_URL = 'http://localhost:3001';

// Endpoints to test
const endpoints = [
  '/rbac-test/public',
  '/rbac-test/authenticated',
  '/rbac-test/staff',
  '/rbac-test/organizer',
  '/rbac-test/admin'
];

// Sample users with different roles
// Note: These users need to exist in your database with the correct roles
const users = [
  { email: 'user@example.com', password: 'password' }, // USER role
  { email: 'staff@example.com', password: 'password' }, // STAFF role
  { email: 'organizer@example.com', password: 'password' }, // ORGANIZER role
  { email: 'admin@example.com', password: 'password' } // ADMIN role
];

// Function to login and get a token
async function login(user) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to login: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      token: data.access_token,
      role: data.user?.role || 'No role found'
    };
  } catch (error) {
    console.error(`Login error for ${user.email}:`, error.message);
    return null;
  }
}

// Function to test an endpoint with a token
async function testEndpoint(endpoint, token) {
  try {
    // For public endpoint, we don't need a token
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers
    });

    const status = response.status;
    let data = null;
    
    if (response.ok) {
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
    }

    return { status, data };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return { status: 'Error', data: null };
  }
}

// Main function to run the tests
async function runTests() {
  console.log('Starting NestJS RBAC Tests\n');
  
  // Test public endpoint without login
  console.log('Testing public endpoint without authentication');
  const publicResult = await testEndpoint('/rbac-test/public', null);
  console.log(`  Status: ${publicResult.status}`);
  console.log(`  Response: ${JSON.stringify(publicResult.data)}\n`);
  
  // Test for each user
  for (const user of users) {
    console.log(`Testing as ${user.email}`);
    
    const loginResult = await login(user);
    if (!loginResult) {
      console.log(`  Could not login as ${user.email}, skipping tests for this user\n`);
      continue;
    }
    
    console.log(`  Access token obtained successfully (Role: ${loginResult.role})`);
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint, loginResult.token);
      const accessStatus = result.status === 200 ? 'ALLOWED' : 'DENIED';
      
      console.log(`  ${endpoint}: ${accessStatus} (Status ${result.status})`);
      if (result.data) {
        if (typeof result.data === 'string') {
          console.log(`    Response: ${result.data}`);
        } else {
          console.log(`    Response: ${JSON.stringify(result.data.message || result.data)}`);
        }
      }
    }
    
    console.log(''); // Empty line between users
  }
  
  console.log('NestJS RBAC Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
}); 