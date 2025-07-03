-- Database initialization script for Daawa Event Management System
-- This script sets up the initial database structure and configurations

-- Create additional databases for different environments
CREATE DATABASE daawa_development;
CREATE DATABASE daawa_test;
CREATE DATABASE daawa_staging;

-- Create a dedicated user for the application
CREATE USER daawa_user WITH PASSWORD 'daawa_secure_password';

-- Grant privileges to the daawa_user
GRANT ALL PRIVILEGES ON DATABASE daawa TO daawa_user;
GRANT ALL PRIVILEGES ON DATABASE daawa_development TO daawa_user;
GRANT ALL PRIVILEGES ON DATABASE daawa_test TO daawa_user;
GRANT ALL PRIVILEGES ON DATABASE daawa_staging TO daawa_user;

-- Enable required extensions
\c daawa;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c daawa_development;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c daawa_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c daawa_staging;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Switch back to main database
\c daawa;

-- Create initial schema placeholder (will be managed by TypeORM migrations)
-- This is just a placeholder - actual tables will be created via TypeORM
CREATE SCHEMA IF NOT EXISTS public; 