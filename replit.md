# Overview

This is a crypto transaction fraud detection system built as a multi-agent architecture. The system monitors blockchain transactions in real-time, analyzes behavior patterns using machine learning algorithms, and generates alerts for suspicious activities. It features a React-based dashboard for monitoring agent status, transaction flows, alerts, and generating compliance reports.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript and a modern component-based architecture. The UI is built with shadcn/ui components for consistent styling and uses Tailwind CSS for responsive design. React Query handles server state management and caching, while React Hook Form manages form validation. The application follows a multi-page structure with routing handled by Wouter, including pages for dashboard, agents, transactions, alerts, reports, wallets, and audit logs.

## Backend Architecture
The server is built with Express.js and TypeScript, following a modular structure with separate route handling, database operations, and agent management. The system uses a multi-agent pattern where specialized agents handle different aspects of fraud detection:

- **Transaction Monitor Agent**: Polls blockchain data every 5 seconds for new transactions
- **Behavior Analysis Agent**: Analyzes transaction patterns every 10 seconds for anomalies
- **Risk Scoring Agent**: Calculates fraud probability scores every 8 seconds using ML algorithms
- **Alerting Agent**: Processes high-risk transactions every 6 seconds and generates alerts
- **Reporting Agent**: Generates compliance reports and system analytics every 30 seconds

Each agent runs independently with configurable intervals and can be monitored and controlled through the dashboard.

## Data Storage
The system uses both PostgreSQL and MongoDB for different purposes. PostgreSQL with Drizzle ORM is configured for primary data operations, while MongoDB with Mongoose handles session storage and real-time data. Key data models include users, agents, transactions, alerts, wallet profiles, reports, and audit logs.

## Real-time Communication
WebSocket connections enable real-time updates between the server and client, broadcasting agent status changes, new alerts, and transaction updates. The system maintains connection resilience with automatic reconnection and heartbeat mechanisms.

## Authentication and Session Management
The system uses session-based authentication with secure cookie configuration. Sessions are stored in MongoDB using connect-mongo, providing scalable session management and user audit trails.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database configured via Drizzle ORM for structured data operations
- **MongoDB**: Document database for session storage and real-time data using Mongoose ODM

## UI Framework and Styling
- **shadcn/ui**: Pre-built React components with Radix UI primitives for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework for responsive design and theming
- **Radix UI**: Headless UI primitives for complex components like dialogs, dropdowns, and navigation

## State Management and Data Fetching
- **TanStack React Query**: Server state management, caching, and background updates
- **React Hook Form**: Form validation and state management with @hookform/resolvers for validation schemas

## Real-time Features
- **WebSocket (ws)**: Real-time bidirectional communication for live updates
- **Socket.io integration**: Enhanced WebSocket functionality for connection management

## Authentication and Security
- **bcrypt**: Password hashing and validation
- **express-session**: Session middleware for Express.js
- **connect-mongo**: MongoDB session store for Express sessions

## Development and Build Tools
- **Vite**: Fast development server and build tool with HMR support
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Replit Integration**: Development environment integration with error overlays and cartographer