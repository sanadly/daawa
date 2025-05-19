#!/usr/bin/env node

/**
 * Port Finder Utility
 * 
 * This script helps with:
 * 1. Finding available ports in a range
 * 2. Checking if a specific port is available
 * 3. Discovering which port the server is running on
 * 
 * Usage:
 *   node port-finder.js check 3000 3010   # Check for an available port in range
 *   node port-finder.js find               # Find and report which port the server is using
 *   node port-finder.js kill 3000 3010     # Kill any processes using ports in the range
 *   node port-finder.js status             # Show detailed status of ports in range
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

// Configuration
const PORT_RANGE = {
  min: 3000,
  max: 3010
};

// Helper function to check if a port is in use
function isPortInUse(port) {
  try {
    // Try to determine the OS-specific command
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
    
    const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return result.trim().length > 0;
  } catch (error) {
    // If the command exits with non-zero, the port is likely free
    return false;
  }
}

// Get more detailed process information for a port
function getProcessInfoForPort(port) {
  try {
    const cmd = process.platform === 'win32'
      ? `netstat -ano | findstr :${port} | findstr LISTENING`
      : `lsof -i :${port} | grep LISTEN`;
    
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return null;
  }
}

// Find the first available port in a range
function findAvailablePort(start = PORT_RANGE.min, end = PORT_RANGE.max) {
  for (let port = start; port <= end; port++) {
    if (!isPortInUse(port)) {
      return port;
    }
  }
  return null; // No available ports found
}

// Check if server is running and what port it's using
function findServerPort() {
  // Check if we have a stored port file
  const portFilePath = path.join(__dirname, '../current-port.json');
  
  console.log(`Looking for port file at: ${portFilePath}`);
  if (fs.existsSync(portFilePath)) {
    try {
      const portData = JSON.parse(fs.readFileSync(portFilePath, 'utf8'));
      console.log(`Found port file with port: ${portData.port}`);
      if (portData.port && isPortInUse(portData.port)) {
        console.log(`Confirming port ${portData.port} is in use...`);
        return portData.port;
      } else {
        console.log(`Port ${portData.port} from port file is not in use`);
      }
    } catch (error) {
      console.error('Error reading port file:', error.message);
    }
  } else {
    console.log('Port file not found, will scan ports');
  }
  
  // If no port file or it's not accurate, scan the range
  console.log(`Scanning ports ${PORT_RANGE.min} to ${PORT_RANGE.max} for active server...`);
  for (let port = PORT_RANGE.min; port <= PORT_RANGE.max; port++) {
    if (isPortInUse(port)) {
      console.log(`Found process on port ${port}, checking if it's our server...`);
      
      // Try to get process info
      const processInfo = getProcessInfoForPort(port);
      if (processInfo) {
        console.log(`Process info for port ${port}: ${processInfo}`);
      }
      
      // Try HTTP check with a small timeout
      try {
        const makeRequest = () => {
          return new Promise((resolve, reject) => {
            const req = http.request({
              host: 'localhost',
              port: port,
              path: '/health',
              method: 'GET',
              timeout: 1000
            }, (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                resolve({ statusCode: res.statusCode, data });
              });
            });
            
            req.on('error', (err) => {
              reject(err);
            });
            
            req.on('timeout', () => {
              req.destroy();
              reject(new Error('Request timed out'));
            });
            
            req.end();
          });
        };
        
        // Use an immediately invoked async function
        (async () => {
          try {
            const response = await makeRequest();
            if (response.statusCode === 200) {
              console.log(`Server confirmed running on port ${port} with response: ${response.data}`);
              
              // Save the port for future reference
              fs.writeFileSync(portFilePath, JSON.stringify({ port }));
              console.log(`Saved port ${port} to ${portFilePath}`);
              
              return port;
            } else {
              console.log(`Received non-200 response (${response.statusCode}) from port ${port}`);
            }
          } catch (error) {
            console.log(`HTTP check failed for port ${port}: ${error.message}`);
          }
        })();
      } catch (error) {
        console.log(`Error during HTTP check for port ${port}: ${error}`);
      }
    }
  }
  
  return null; // Server not found or not responding to health checks
}

// Kill processes using ports in a range
function killPortProcesses(start = PORT_RANGE.min, end = PORT_RANGE.max) {
  for (let port = start; port <= end; port++) {
    try {
      if (isPortInUse(port)) {
        const processInfo = getProcessInfoForPort(port);
        console.log(`Found process on port ${port}:`);
        console.log(processInfo);
        
        const cmd = process.platform === 'win32'
          ? `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') DO taskkill /F /PID %P`
          : `kill -9 $(lsof -t -i:${port})`;
        
        execSync(cmd, { stdio: 'inherit' });
        console.log(`Killed process using port ${port}`);
      }
    } catch (error) {
      console.error(`Error killing process on port ${port}:`, error.message);
    }
  }
}

// Show detailed status of all ports in the range
function showPortsStatus(start = PORT_RANGE.min, end = PORT_RANGE.max) {
  console.log(`\nPort Status Report (${start}-${end}):`);
  console.log('----------------------------------');
  
  let portFile = null;
  const portFilePath = path.join(__dirname, '../current-port.json');
  if (fs.existsSync(portFilePath)) {
    try {
      portFile = JSON.parse(fs.readFileSync(portFilePath, 'utf8'));
      console.log(`Port file exists at ${portFilePath}: ${JSON.stringify(portFile)}`);
    } catch (e) {
      console.log(`Port file exists but couldn't be parsed: ${e.message}`);
    }
  } else {
    console.log(`Port file doesn't exist at ${portFilePath}`);
  }
  
  console.log('\nChecking ports:');
  for (let port = start; port <= end; port++) {
    if (isPortInUse(port)) {
      console.log(`\nPort ${port}: IN USE`);
      
      // Is this our saved port?
      if (portFile && portFile.port === port) {
        console.log(`This is the saved backend port!`);
      }
      
      // Get process info
      const processInfo = getProcessInfoForPort(port);
      console.log(`Process info: ${processInfo}`);
      
      // Try a health check
      try {
        const result = execSync(`curl -s -m 1 http://localhost:${port}/health`, { 
          encoding: 'utf8', 
          stdio: ['pipe', 'pipe', 'pipe'] 
        });
        console.log(`Health check response: ${result.trim()}`);
      } catch (e) {
        console.log(`Health check failed: ${e.message}`);
      }
    } else {
      console.log(`Port ${port}: available`);
    }
  }
  
  // Check what NestJS processes are running
  try {
    console.log('\nChecking for NestJS processes:');
    const processesResult = execSync('ps aux | grep nest', { encoding: 'utf8' });
    console.log(processesResult);
  } catch (e) {
    console.log(`Error checking processes: ${e.message}`);
  }
}

// Main command handler
function main() {
  const command = process.argv[2];
  const start = parseInt(process.argv[3]) || PORT_RANGE.min;
  const end = parseInt(process.argv[4]) || PORT_RANGE.max;
  
  switch (command) {
    case 'check':
      const availablePort = findAvailablePort(start, end);
      if (availablePort) {
        console.log(`Available port: ${availablePort}`);
      } else {
        console.error(`No available ports in range ${start}-${end}`);
        process.exit(1);
      }
      break;
      
    case 'find':
      const serverPort = findServerPort();
      if (serverPort) {
        console.log(`Server is running on port ${serverPort}`);
      } else {
        console.error('Server not found or not responding to health checks');
        process.exit(1);
      }
      break;
      
    case 'kill':
      killPortProcesses(start, end);
      console.log(`Attempted to kill all processes using ports ${start}-${end}`);
      break;
    
    case 'status':
      showPortsStatus(start, end);
      break;
      
    default:
      console.log(`
Port Finder Utility

Usage:
  node port-finder.js check [start] [end]   # Check for an available port
  node port-finder.js find                  # Find server port
  node port-finder.js kill [start] [end]    # Kill processes using ports
  node port-finder.js status                # Show detailed status of all ports
  
Default port range: ${PORT_RANGE.min}-${PORT_RANGE.max}
      `);
      break;
  }
}

// Run the main function
main(); 