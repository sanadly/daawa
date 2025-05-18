#!/bin/bash

# Install all dependencies needed for the RBAC implementation
npm install --save @nestjs/common @nestjs/core @nestjs/jwt @nestjs/passport passport passport-jwt
npm install --save-dev @types/jest @types/supertest supertest jest ts-jest @nestjs/testing @types/passport-jwt

echo "Dependencies installed successfully!" 