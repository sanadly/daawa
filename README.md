# Daawa - Event Management System

A comprehensive event management platform built with Next.js frontend and NestJS
backend.

## 🏗️ Project Structure

This is a monorepo organized using npm workspaces. The structure is designed for
scalability and maintainability.

```
daawa/
├── apps/                    # Main applications
│   ├── frontend/           # Next.js frontend application
│   └── backend/            # NestJS backend application
├── packages/               # Shared libraries and utilities
│   ├── shared/            # Common utilities and helpers
│   ├── ui/                # Shared UI components
│   ├── types/             # TypeScript type definitions
│   └── config/            # Shared configuration
├── tools/                  # Development tools and scripts
│   ├── scripts/           # Build and deployment scripts
│   └── config/            # Tool configuration files
├── docs/                   # Project documentation
│   ├── setup/             # Setup and installation guides
│   ├── api/               # API documentation
│   └── architecture/      # System architecture docs
└── .taskmaster/           # Task management system
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd daawa
```

2. Install dependencies:

```bash
npm install
```

3. Start development servers:

```bash
npm run dev
```

This will start both frontend and backend development servers concurrently.

## 📜 Available Scripts

### Root Level Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:backend` - Start only the backend development server
- `npm run build` - Build all workspaces
- `npm run test` - Run tests across all workspaces
- `npm run lint` - Lint all workspaces
- `npm run format` - Format code using Prettier
- `npm run typecheck` - Type check all TypeScript code
- `npm run clean` - Remove all node_modules

## 🏛️ Architecture

### Frontend (Next.js)

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **State Management**: TBD (Redux Toolkit/Zustand)
- **Authentication**: NextAuth.js or custom JWT

### Backend (NestJS)

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control
- **API**: RESTful APIs with OpenAPI documentation
- **Validation**: class-validator and class-transformer

### Shared Packages

- **Types**: Shared TypeScript definitions
- **UI**: Reusable React components
- **Shared**: Common utilities and helpers
- **Config**: Shared configuration files

## 🔧 Development Workflow

1. **Feature Development**: Create feature branches from `main`
2. **Code Quality**: ESLint, Prettier, and pre-commit hooks ensure code quality
3. **Testing**: Unit and integration tests for both frontend and backend
4. **CI/CD**: Automated testing and deployment pipeline

## 📚 Documentation

- [Setup Guide](docs/setup/README.md)
- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

# Linting and Formatting Setup Complete
