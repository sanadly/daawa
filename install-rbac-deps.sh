#!/bin/bash

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Installing RBAC Dependencies =====${NC}\n"

# NestJS dependencies
echo -e "${YELLOW}Installing NestJS dependencies...${NC}"
npm install --save @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport passport passport-jwt

# Development dependencies
echo -e "${YELLOW}Installing development dependencies...${NC}"
npm install --save-dev @types/jest @types/supertest supertest jest ts-jest @nestjs/testing @types/passport-jwt @nestjs/config

echo -e "\n${GREEN}✅ All dependencies installed successfully!${NC}"
echo -e "${YELLOW}Now you can run the tests with:${NC}"
echo -e "  - npm run test               (Unit tests)"
echo -e "  - npm run test:e2e           (End-to-end tests)"
echo -e "  - ./test-rbac-permissions.sh (Custom RBAC tests)" 