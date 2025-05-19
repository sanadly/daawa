#!/bin/bash

echo "Restarting backend services..."

# Kill all Node.js processes running the backend
echo "Killing all existing backend processes..."
pkill -f "node.*backend/dist/src/main" || echo "No backend processes found to kill"

# Wait a moment to make sure all processes have terminated
sleep 1

# Update the port file to ensure consistent port
echo "Setting default port to 3006..."
echo '{"port":3006}' > ./backend/current-port.json

# Change to the backend directory
cd ./backend || { echo "Failed to change directory to backend"; exit 1; }

# Add debug logging
echo "Enabling detailed logging in .env..."
if [ -f .env ]; then
  # Create a backup
  cp .env .env.bak
  # Add or update LOG_LEVEL
  if grep -q "LOG_LEVEL" .env; then
    sed -i '' 's/LOG_LEVEL=.*/LOG_LEVEL=debug/' .env
  else
    echo "LOG_LEVEL=debug" >> .env
  fi
  # Add or update DEBUG
  if grep -q "DEBUG" .env; then
    sed -i '' 's/DEBUG=.*/DEBUG=true/' .env
  else
    echo "DEBUG=true" >> .env
  fi
else
  # Create new .env file with debug settings
  cat > .env << EOF
LOG_LEVEL=debug
DEBUG=true
EOF
fi

# Show database file for checking
echo "Checking for SQLite database file..."
ls -la prisma/

# Start the backend on port 3006 with debug output
echo "Starting backend on port 3006 with debug logs..."
DEBUG=* PORT=3006 npm run start:dev &

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Verify the backend is running
echo "Verifying backend health check..."
curl -s http://localhost:3006/health || echo "Warning: Backend health check failed"

# Test login with the default credentials
echo -e "\nTesting login with admin credentials..."
curl -v -X POST -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' http://localhost:3006/auth/login

echo -e "\nTesting login with test user credentials..."
curl -v -X POST -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"password123"}' http://localhost:3006/auth/login

echo -e "\nTesting direct login bypass..."
curl -v -X POST -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"admin123"}' http://localhost:3006/auth/login-direct

echo -e "\nChecking user records directly in database..."
cd prisma
npx prisma studio &
sleep 3

echo -e "\nBackend restart complete." 