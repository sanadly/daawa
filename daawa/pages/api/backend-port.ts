import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Updated default port to match the backend's current port
const DEFAULT_PORT = 3002;
// Fix the port file path to work in different environments
const PORT_FILE_PATH = path.resolve(process.cwd(), '../backend/current-port.json');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const port = await detectBackendPort();
    
    return res.status(200).json({
      baseUrl: `http://localhost:${port}`,
      port,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error detecting backend port:', error);
    return res.status(500).json({
      error: 'Failed to detect backend port',
      baseUrl: `http://localhost:${DEFAULT_PORT}`,
      port: DEFAULT_PORT,
      fallback: true
    });
  }
}

async function detectBackendPort(): Promise<number> {
  // Try reading from the port file first
  try {
    const portFilePath = path.resolve(process.cwd(), PORT_FILE_PATH);
    if (fs.existsSync(portFilePath)) {
      const data = JSON.parse(fs.readFileSync(portFilePath, 'utf8'));
      if (data && data.port) {
        // Verify this port is actually in use
        try {
          // Make a health check to verify the port is active
          await fetch(`http://localhost:${data.port}/health`, { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          console.log(`Verified backend running on port ${data.port}`);
          return data.port;
        } catch (_error) {
          console.warn(`Port file exists but health check failed for port ${data.port}. Error:`, _error);
          // Continue to alternative detection methods
        }
      }
    }
  } catch (_error) {
    console.warn('Error reading port file:', _error);
    // Continue to alternative detection methods
  }

  // If we're in development, try running the port-finder script
  try {
    const { stdout } = await execAsync('cd ../../backend && node scripts/port-finder.js find');
    const match = stdout.match(/Server is running on port (\d+)/);
    if (match && match[1]) {
      const port = parseInt(match[1], 10);
      console.log(`Detected backend port ${port} using port-finder script`);
      return port;
    }
  } catch (_error) {
    console.warn('Port-finder script failed. Error:', _error);
    // Continue to fallback
  }

  // Fallback: Try health checks on common ports
  const portsToTry = [3002, 3001, 3000, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
  
  for (const port of portsToTry) {
    try {
      const response = await fetch(`http://localhost:${port}/health`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        console.log(`Found backend through health check on port ${port}`);
        return port;
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // Continue to next port
    }
  }

  // If all detection methods fail, return the default port
  console.log(`No active backend detected, returning default port ${DEFAULT_PORT}`);
  return DEFAULT_PORT;
} 