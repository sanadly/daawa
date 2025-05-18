// For node-fetch v2 (CommonJS)
const fetch = require('node-fetch');

// Base URL of our NestJS API
const API_URL = 'http://localhost:3001';

// Define color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// All endpoints to test
const endpoints = [
  // RBAC test endpoints
  { method: 'GET', path: '/rbac-test/public', name: 'Public Test' },
  { method: 'GET', path: '/rbac-test/authenticated', name: 'Authenticated Test' },
  { method: 'GET', path: '/rbac-test/staff', name: 'Staff Test' },
  { method: 'GET', path: '/rbac-test/organizer', name: 'Organizer Test' },
  { method: 'GET', path: '/rbac-test/admin', name: 'Admin Test' },
  
  // RBAC controller endpoints
  { method: 'GET', path: '/rbac/authenticated', name: 'RBAC Authenticated' },
  { method: 'GET', path: '/rbac/staff', name: 'RBAC Staff' },
  { method: 'GET', path: '/rbac/organizer', name: 'RBAC Organizer' },
  { method: 'GET', path: '/rbac/admin', name: 'RBAC Admin' },
  
  // Events controller endpoints
  { method: 'GET', path: '/events', name: 'List Events' },
  { method: 'GET', path: '/events/1', name: 'View Event' },
  { method: 'POST', path: '/events', name: 'Create Event', body: { 
    title: 'New Event', 
    description: 'Created during test', 
    dateTime: new Date().toISOString(), 
    location: 'Test Location' 
  }},
  { method: 'PUT', path: '/events/1', name: 'Update Event', body: { 
    title: 'Updated Event', 
    description: 'Updated during test', 
    dateTime: new Date().toISOString(), 
    location: 'Updated Location' 
  }},
  { method: 'DELETE', path: '/events/1', name: 'Delete Event' },
  { method: 'GET', path: '/events/1/registrations', name: 'Event Registrations' },
];

// Sample users with different roles
const users = [
  { email: 'user@example.com', password: 'password', expectedRole: 'USER' },
  { email: 'staff@example.com', password: 'password', expectedRole: 'STAFF' },
  { email: 'organizer@example.com', password: 'password', expectedRole: 'ORGANIZER' },
  { email: 'admin@example.com', password: 'password', expectedRole: 'ADMIN' }
];

// Expected access by role
const accessMatrix = {
  // Format: endpoint.name: [roles that should have access]
  'Public Test': ['*'], // * means unauthenticated access
  'Authenticated Test': ['USER', 'STAFF', 'ORGANIZER', 'ADMIN'],
  'Staff Test': ['STAFF', 'ORGANIZER', 'ADMIN'],
  'Organizer Test': ['ORGANIZER', 'ADMIN'],
  'Admin Test': ['ADMIN'],
  
  'RBAC Authenticated': ['USER', 'STAFF', 'ORGANIZER', 'ADMIN'],
  'RBAC Staff': ['STAFF', 'ORGANIZER', 'ADMIN'],
  'RBAC Organizer': ['ORGANIZER', 'ADMIN'],
  'RBAC Admin': ['ADMIN'],
  
  'List Events': ['USER', 'STAFF', 'ORGANIZER', 'ADMIN'],
  'View Event': ['USER', 'STAFF', 'ORGANIZER', 'ADMIN'],
  'Create Event': ['ORGANIZER', 'ADMIN'],
  'Update Event': ['ORGANIZER', 'ADMIN'],
  'Delete Event': ['ADMIN'],
  'Event Registrations': ['STAFF', 'ORGANIZER', 'ADMIN'],
};

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
    
    // Check if the role matches what we expect
    const actualRole = data.user?.role || 'No role found';
    if (actualRole !== user.expectedRole) {
      console.log(`${colors.yellow}Warning: Expected role ${user.expectedRole} but got ${actualRole}${colors.reset}`);
    }
    
    return {
      token: data.access_token,
      role: actualRole
    };
  } catch (error) {
    console.error(`${colors.red}Login error for ${user.email}:${colors.reset}`, error.message);
    return null;
  }
}

// Function to test an endpoint with a token
async function testEndpoint(endpoint, token) {
  try {
    // For public endpoint, we don't need a token
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
      method: endpoint.method,
      headers
    };
    
    if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
      options.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(`${API_URL}${endpoint.path}`, options);

    const status = response.status;
    let data = null;
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    }

    return { status, data };
  } catch (error) {
    console.error(`${colors.red}Error testing ${endpoint.path}:${colors.reset}`, error.message);
    return { status: 'Error', data: null };
  }
}

// Function to check if access should be allowed based on the matrix
function shouldHaveAccess(endpointName, userRole) {
  if (!accessMatrix[endpointName]) {
    return false;
  }
  
  if (accessMatrix[endpointName].includes('*')) {
    return true; // Public endpoint
  }
  
  return accessMatrix[endpointName].includes(userRole);
}

// Main function to run the tests
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}Starting NestJS RBAC Endpoint Tests${colors.reset}\n`);
  
  // First test public endpoints without authentication
  console.log(`${colors.bright}${colors.magenta}Testing Public Endpoints (No Authentication)${colors.reset}\n`);
  
  for (const endpoint of endpoints) {
    if (accessMatrix[endpoint.name].includes('*')) {
      console.log(`${colors.bright}Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})${colors.reset}`);
      
      const result = await testEndpoint(endpoint, null);
      const accessStatus = result.status === 200 ? `${colors.green}ALLOWED${colors.reset}` : `${colors.red}DENIED${colors.reset}`;
      
      console.log(`  Status: ${accessStatus} (${result.status})`);
      if (result.data) {
        if (typeof result.data === 'string') {
          console.log(`  Response: ${result.data.substring(0, 100)}${result.data.length > 100 ? '...' : ''}`);
        } else {
          console.log(`  Response: ${JSON.stringify(result.data.message || result.data).substring(0, 100)}...`);
        }
      }
      console.log(''); // Empty line
    }
  }
  
  // Test for each user role
  for (const user of users) {
    console.log(`${colors.bright}${colors.magenta}Testing as ${user.expectedRole} (${user.email})${colors.reset}`);
    
    const loginResult = await login(user);
    if (!loginResult) {
      console.log(`  ${colors.red}Could not login as ${user.email}, skipping tests for this user${colors.reset}\n`);
      continue;
    }
    
    console.log(`  ${colors.green}Access token obtained successfully (Role: ${loginResult.role})${colors.reset}`);
    
    let passCount = 0;
    let failCount = 0;
    let errorCount = 0;
    
    for (const endpoint of endpoints) {
      const expected = shouldHaveAccess(endpoint.name, loginResult.role);
      const expectedStatus = expected ? `${colors.green}ALLOWED${colors.reset}` : `${colors.red}DENIED${colors.reset}`;
      
      console.log(`  Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path}) - Expected: ${expectedStatus}`);
      
      const result = await testEndpoint(endpoint, loginResult.token);
      
      let actualStatus;
      if (result.status === 'Error') {
        actualStatus = `${colors.yellow}ERROR${colors.reset}`;
        errorCount++;
      } else {
        const allowed = result.status >= 200 && result.status < 300;
        actualStatus = allowed ? `${colors.green}ALLOWED${colors.reset}` : `${colors.red}DENIED${colors.reset}`;
        
        if ((expected && allowed) || (!expected && !allowed)) {
          passCount++;
        } else {
          failCount++;
        }
      }
      
      const statusMatch = (expected && result.status >= 200 && result.status < 300) || 
                          (!expected && (result.status === 401 || result.status === 403));
      
      console.log(`    Result: ${actualStatus} (Status ${result.status}) - ${statusMatch ? colors.green + '✓ CORRECT' : colors.red + '✗ INCORRECT'}${colors.reset}`);
      
      if (result.data) {
        if (typeof result.data === 'string') {
          console.log(`    Response: ${result.data.substring(0, 100)}${result.data.length > 100 ? '...' : ''}`);
        } else {
          const responseText = JSON.stringify(result.data.message || result.data);
          console.log(`    Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        }
      }
    }
    
    console.log(`\n  ${colors.bright}Summary for ${loginResult.role}:${colors.reset}`);
    console.log(`    ${colors.green}✓ Passed: ${passCount}${colors.reset}`);
    console.log(`    ${colors.red}✗ Failed: ${failCount}${colors.reset}`);
    console.log(`    ${colors.yellow}! Errors: ${errorCount}${colors.reset}`);
    console.log(''); // Empty line
  }
  
  console.log(`${colors.bright}${colors.cyan}NestJS RBAC Tests Completed${colors.reset}`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test error:${colors.reset}`, error);
}); 