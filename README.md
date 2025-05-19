# Daawa Application

This is a modern web application with a Next.js frontend and NestJS backend.

## Features

- User authentication system with JWT
- Dynamic port discovery for backend
- Automated port management for local development
- Health checks API

## Project Structure

- `/daawa` - Next.js frontend application
- `/backend` - NestJS backend API
- `/scripts` - Utility scripts for project management

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL (for the backend)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm run setup
```

This will install dependencies for the root project, frontend, and backend.

### Environment Setup

Create a `.env` file in the `/backend` directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/daawa?schema=public"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="3600s"

# Email (optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@example.com
```

### Development

To start the frontend development server:

```bash
npm run dev
```

To start the backend server:

```bash
npm run backend:start
```

To start the backend with a clean state (kills any running instances):

```bash
npm run backend:clean
```

### Port Management

The backend server uses dynamic port allocation. By default, it will try ports in the range 3000-3010 until it finds an available one. The selected port is stored in `backend/current-port.json`.

To check which port the backend is running on:

```bash
npm run backend:port
```

To see detailed status of all ports:

```bash
npm run backend:status
```

### Frontend API Configuration

The frontend automatically detects which port the backend is running on through:

1. The environment variable `NEXT_PUBLIC_API_URL` if set
2. An API endpoint `/api/backend-port` that checks multiple detection methods
3. Fallback to a default port (3006)

## Testing

### Default Test Users

When running in development mode, the application automatically creates two test users:

1. Regular User:
   - Email: user@example.com
   - Password: password123
   - Role: USER

2. Admin:
   - Email: admin@example.com
   - Password: admin123
   - Roles: ADMIN, USER

## Troubleshooting

If you encounter issues with the backend server:

1. Check which ports are being used:
   ```bash
   npm run backend:status
   ```

2. Kill any running backend processes and start fresh:
   ```bash
   npm run backend:clean
   ```

3. Check logs for errors:
   ```bash
   cd backend
   npm run start:dev
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 