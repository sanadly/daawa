#!/bin/bash

# Daawa Environment Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Setting up Daawa development environment..."

# Function to display usage
show_usage() {
    echo "Usage: $0 [development|staging|production]"
    echo "Default: development"
    exit 1
}

# Get environment parameter
ENVIRONMENT=${1:-development}

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        echo "📝 Setting up $ENVIRONMENT environment..."
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        show_usage
        ;;
esac

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please use Node.js $REQUIRED_VERSION or higher."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

# Copy environment file
if [[ -f "environments/${ENVIRONMENT}.env" ]]; then
    if [[ ! -f ".env" ]]; then
        echo "📋 Copying environment file for $ENVIRONMENT..."
        cp "environments/${ENVIRONMENT}.env" .env
        echo "✅ Environment file created. Please review and update .env with your actual values."
    else
        echo "⚠️  .env file already exists. Please manually merge with environments/${ENVIRONMENT}.env if needed."
    fi
else
    echo "❌ Environment file for $ENVIRONMENT not found!"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p temp

# Set permissions for upload directory
chmod 755 uploads

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker detected"
    
    # Check if Docker Compose is available
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo "✅ Docker Compose detected"
        echo "💡 You can start the development environment with: docker-compose up -d"
    fi
else
    echo "⚠️  Docker not detected. Some features may not be available."
fi

# Generate JWT secret if not in production
if [[ "$ENVIRONMENT" == "development" ]]; then
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        echo "🔐 Generated JWT secret for development: $JWT_SECRET"
        echo "💡 Add this to your .env file: JWT_SECRET=$JWT_SECRET"
    fi
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update the .env file with your actual values"
echo "2. Start the database: docker-compose up -d postgres redis"
echo "3. Run database migrations: npm run migration:run"
echo "4. Start the development servers:"
echo "   - Frontend: npm run dev:frontend"
echo "   - Backend: npm run dev:backend"
echo "   - Both: npm run dev"
echo ""
echo "For Docker development:"
echo "   docker-compose up -d"
echo ""
echo "Happy coding! 🚀" 