import { NextApiRequest, NextApiResponse } from 'next';

/* eslint-disable @typescript-eslint/no-unused-vars */
const RESERVED_PORTS = [3200]; // eslint-disable-line
const DEFAULT_PORT = 3010; // Change to port that actually works
/* eslint-enable @typescript-eslint/no-unused-vars */

// Cache the response for improved performance
let cachedPort: number | null = null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (cachedPort) {
    return res.status(200).json({ port: cachedPort });
  }

  // Directly use port 3010 since we know it's working
  cachedPort = 3010;
  return res.status(200).json({ port: cachedPort });
} 