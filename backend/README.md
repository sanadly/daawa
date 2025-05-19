<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Daawa Backend API

## Overview

This is the backend API for the Daawa application, built with:

- NestJS - A progressive Node.js framework for building server-side applications
- Prisma - Next-generation ORM for Node.js and TypeScript
- PostgreSQL - The database system
- Passport & JWT - Authentication and authorization

## Features

- Comprehensive JWT-based authentication system
- Role-based access control (RBAC)
- Dynamic port configuration for local development
- Multi-language support
- Email functionality
- Event management capabilities
- Health check API

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL (local or remote)

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/daawa?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/daawa?schema=public"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="3600s"
JWT_REFRESH_SECRET="your-refresh-token-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Email (optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@example.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000
```

### Installation

```bash
npm install
```

### Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### Starting the Server

```bash
# Development mode with auto-restart
npm run start:dev

# Production mode
npm run start:prod
```

The server includes automatic port selection. It will try to use the following in order:
1. PORT environment variable if set
2. Available port in the range 3000-3010 (configurable)

### Test Users

When running in development mode, the application automatically creates two test users:

1. Regular User:
   - Email: user@example.com
   - Password: password123
   - Role: USER

2. Admin:
   - Email: admin@example.com
   - Password: admin123
   - Role: ADMIN

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive access token
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (invalidate tokens)
- `GET /auth/profile` - Get current user profile
- `GET /auth/verify-email` - Verify email address
- `POST /auth/resend-verification` - Resend verification email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users

- `GET /users/profile` - Get current user's profile
- `PUT /users/profile` - Update user profile

### Events

- `GET /events` - List events
- `GET /events/:id` - Get event details
- `POST /events` - Create event
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### RBAC (Role-Based Access Control)

- Endpoints for testing various permission levels
- Role management API

## Troubleshooting

If you encounter issues:

1. Check for port conflicts using port-finder:
   ```bash
   node scripts/port-finder.js status
   ```

2. Kill any processes using conflicting ports:
   ```bash
   node scripts/port-finder.js kill
   ```

3. Check for valid `.env` configuration

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Dynamic Port Management

This application includes built-in dynamic port management to prevent port conflicts. The server will automatically find an available port within a configurable range (default: 3000-3010) if the preferred port is already in use.

### How It Works

1. In development mode, the server will attempt to bind to the port specified in the `PORT` environment variable.
2. If that port is unavailable, it will automatically increment and try the next available port in the range.
3. Once a port is found, the server writes the port information to `current-port.json` for other services to discover.
4. The frontend application automatically detects which port the backend is running on.

### Available Scripts

```bash
# Check for an available port in the range
npm run port:check

# Find which port the server is currently running on
npm run port:find

# Kill processes using ports in the range
npm run port:kill

# Clean up any existing processes and start the server
npm run start:clean

# Automatically find an available port and start the server on it
npm run start:auto
```

### Configuring Port Range

The port range can be configured in two places:

1. `src/main.ts` - For the backend server's auto-port-selection
2. `scripts/port-finder.js` - For the utility scripts
3. `daawa/services/api.ts` - For the frontend port discovery

The current configuration uses ports 3000-3010. You can adjust this range based on your specific requirements.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
