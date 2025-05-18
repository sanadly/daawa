#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== NestJS RBAC with Permissions Testing Script =====${NC}\n"

# Clean up any previous test processes
pkill -f "nest start" || true
killall node || true

# Start the backend in the background
npm run start &

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Function to make an HTTP request and display full response
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
    
    # Obtain a token for the role
    local login_response=$(curl -s -X POST http://localhost:3002/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\", \"password\":\"password123\"}")
    
    # Extract the access token
    local token=$(echo "$login_response" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
    
    if [ -z "$token" ]; then
        echo "Failed to get token for role $role"
        echo "Login response: $login_response"
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
        echo -e "${GREEN}✅ Test PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ Test FAILED. Expected $expected_status, got $status${NC}"
        return 1
    fi
}

echo -e "\n${YELLOW}1. Testing Role-Specific Controllers${NC}"
echo -e "\nTesting ADMIN controller access:"
test_endpoint "ADMIN" "/admin/dashboard" "GET" 200
test_endpoint "STAFF" "/admin/dashboard" "GET" 403
test_endpoint "ORGANIZER" "/admin/dashboard" "GET" 403
test_endpoint "USER" "/admin/dashboard" "GET" 403

echo -e "\nTesting ORGANIZER controller access:"
test_endpoint "ADMIN" "/organizer/events" "GET" 200
test_endpoint "ORGANIZER" "/organizer/events" "GET" 200
test_endpoint "STAFF" "/organizer/events" "GET" 403
test_endpoint "USER" "/organizer/events" "GET" 403

echo -e "\nTesting STAFF controller access:"
test_endpoint "ADMIN" "/staff/events" "GET" 200
test_endpoint "ORGANIZER" "/staff/events" "GET" 200
test_endpoint "STAFF" "/staff/events" "GET" 200 
test_endpoint "USER" "/staff/events" "GET" 403

echo -e "\n${YELLOW}2. Testing Permission-Based Access Control${NC}"
echo -e "\nTesting CHECK_IN_ATTENDEE permission:"
test_endpoint "STAFF" "/staff/check-in/1/1" "POST" 201
test_endpoint "USER" "/staff/check-in/1/1" "POST" 403

echo -e "\nTesting VIEW_REPORTS permission:"
test_endpoint "STAFF" "/staff/reports/daily-check-ins" "GET" 200
test_endpoint "USER" "/staff/reports/daily-check-ins" "GET" 403

echo -e "\nTesting CREATE_SUPPORT_TICKET permission (available to all roles):"
test_endpoint "USER" "/staff/support-tickets" "POST" 201
test_endpoint "STAFF" "/staff/support-tickets" "POST" 201

echo -e "\nTesting UPDATE_SUPPORT_TICKET permission (only STAFF and ADMIN):"
test_endpoint "STAFF" "/staff/support-tickets/1" "PUT" 200
test_endpoint "USER" "/staff/support-tickets/1" "PUT" 403

echo -e "\nTesting MANAGE_USERS permission (only ADMIN):"
test_endpoint "ADMIN" "/admin/users" "GET" 200
test_endpoint "STAFF" "/admin/users" "GET" 403

# Clean up
echo -e "\nCleaning up test processes..."
pkill -f "nest start" || true
killall node || true

echo -e "\n${BLUE}RBAC with Permissions Testing completed.${NC}" 