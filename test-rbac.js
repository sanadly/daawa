// For node-fetch v2 (CommonJS)
const fetch = require('node-fetch');

// Base URL of our standalone API
const API_URL = 'http://localhost:3002';

// Endpoints to test
const endpoints = [
  '/rbac/authenticated',
  '/rbac/staff',
  '/rbac/organizer',
  '/rbac/admin'
];

// Sample users with different roles
const users = [
  { email: 'user@example.com', password: 'password', role: 'USER' },
  { email: 'staff@example.com', password: 'password', role: 'STAFF' },
  { email: 'organizer@example.com', password: 'password', role: 'ORGANIZER' },
  { email: 'admin@example.com', password: 'password', role: 'ADMIN' }
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
    return data.access_token;
  } catch (error) {
    console.error(`Login error for ${user.email}:`, error.message);
    return null;
  }
}

// Function to test an endpoint with a token
async function testEndpoint(endpoint, token) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const status = response.status;
    let data = null;
    
    if (response.ok) {
      data = await response.json();
    }

    return { status, data };
  } catch (error) {
    console.error(`Error testing ${endpoint}:`, error.message);
    return { status: 'Error', data: null };
  }
}

// Main function to run the tests
async function runTests() {
  console.log('Starting RBAC Tests\n');
  
  for (const user of users) {
    console.log(`Testing as ${user.role} (${user.email})`);
    
    const token = await login(user);
    if (!token) {
      console.log(`  Could not login as ${user.email}, skipping tests for this user\n`);
      continue;
    }
    
    console.log('  Access token obtained successfully');
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint, token);
      const accessStatus = result.status === 200 ? 'ALLOWED' : 'DENIED';
      
      console.log(`  ${endpoint}: ${accessStatus} (Status ${result.status})`);
      if (result.data) {
        console.log(`    Response: ${JSON.stringify(result.data.message)}`);
      }
    }
    
    console.log(''); // Empty line between users
  }
  
  console.log('RBAC Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
}); 