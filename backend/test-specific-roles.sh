#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== NestJS RBAC Testing Script for STAFF/ORGANIZER =====${NC}\n"

# Clean up any previous test processes
pkill -f "nest start" || true
killall node || true

# Start the backend in the background
npm run start &

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Function to make a HTTP request and display full response
test_endpoint() {
    local role=$1
    local endpoint=$2
    local method=${3:-GET}
    local expected_status=${4:-200}
    local email=$(echo "$role" | tr '[:upper:]' '[:lower:]')@example.com
    
    echo -e "\n============================="
    echo "Testing $method $endpoint with role: $role"
    echo "Expected status: $expected_status"
    echo "============================="
    
    # Obtain a token for the role - capture the full response
    local login_response=$(curl -s -X POST http://localhost:3002/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\", \"password\":\"password123\"}")
    
    # Extract the access token using grep and sed
    local token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
    
    if [ -z "$token" ]; then
        echo "Failed to get token for role $role"
        echo "Login response: $login_response"
        echo "Curl command: curl -X POST http://localhost:3002/auth/login -H \"Content-Type: application/json\" -d '{\"email\":\"$email\", \"password\":\"password123\"}'"
        return 1
    fi
    
    # Debug information
    echo "Obtained token: ${token:0:20}... (truncated)"
    
    # Make the actual request with the token
    local response
    if [ "$method" == "GET" ]; then
        response=$(curl -s -i -X GET "http://localhost:3002$endpoint" \
                -H "Authorization: Bearer $token")
    else
        response=$(curl -s -i -X $method "http://localhost:3002$endpoint" \
                -H "Authorization: Bearer $token" \
                -H "Content-Type: application/json" \
                -d '{"data": "test data"}')
    fi
    
    # Display full response
    echo -e "\nFull response:"
    echo "$response"
    
    # Extract status code
    local status=$(echo "$response" | head -n 1 | grep -o "[0-9]\{3\}")
    
    # Display status
    echo -e "\nStatus code: $status"
    
    # Check if the status matches expected
    if [ "$status" == "$expected_status" ]; then
        echo "✅ Test PASSED"
        return 0
    else
        echo "❌ Test FAILED. Expected $expected_status, got $status"
        return 1
    fi
}

# Testing just specific roles
echo -e "\nTesting STAFF role endpoints..."
test_endpoint "STAFF" "/auth/profile" "GET" 200
test_endpoint "STAFF" "/rbac/staff" "GET" 200
test_endpoint "STAFF" "/rbac/organizer" "GET" 403
test_endpoint "STAFF" "/rbac/admin" "GET" 403

echo -e "\nTesting ORGANIZER role endpoints..."
test_endpoint "ORGANIZER" "/auth/profile" "GET" 200
test_endpoint "ORGANIZER" "/rbac/organizer" "GET" 200
test_endpoint "ORGANIZER" "/rbac/staff" "GET" 403
test_endpoint "ORGANIZER" "/rbac/admin" "GET" 403

# Clean up
echo -e "\nCleaning up test processes..."
pkill -f "nest start" || true
killall node || true

echo -e "\nRBAC Testing completed. See above for results." 