# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediNovel is a subscription-based multi-tenant doctor clinic management SaaS built with:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: SQLite (local development) / MySQL (production) with multi-tenant schema
- **Deployment**: Configured for Vercel (see vercel.json)

## Key Architecture Details

### Backend Structure (`backend/`)
- `src/modules/` - Feature-based modules (Auth, Patients, Doctors, Queue, Billing, Consultations, Prescriptions, etc.)
- `src/middlewares/` - Custom middleware (authentication, RBAC, tenant isolation, validation)
- `src/lib/` - Prisma client singleton and database utilities
- `src/utils/` - Response formatting helpers and constants
- `prisma/` - Database schema (`schema.prisma` for SQLite, `schema.mysql.prisma` for MySQL) and seed scripts
- `src/scripts/` - Utility scripts (e.g., database health checks)

### Frontend Structure (`frontend/`)
- `src/features/` - Feature slices (DoctorDashboard, ReceptionDesk, PatientManagement, Billing, etc.)
- `src/components/` - Reusable UI components (Button, Modal, Form elements, Data tables)
- `src/routes/` - Application routes with role-based guards
- `src/lib/` - API service hooks and utilities (using React Query)
- `src/styles/` - Tailwind CSS configuration and global styles

### Database Design
- Multi-tenant architecture with strict clinic-level data isolation
- Core tables: `clinics` (tenants), `users` (auth), `clinic_users` (tenant-user mapping), `subscription_plans`, `subscriptions`
- Entity tables: `doctors`, `receptionists`, `patients`, `appointments`, `consultations`, `prescriptions`, `payments`
- All entity tables include `clinicId` foreign key for tenant isolation
- Prisma ORM handles database interactions with automatic type generation

## Common Commands

### Root Level
- `npm run dev` - Start both backend and frontend concurrently (development)
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend development server
- `npm run build` - Build both backend and frontend for production
- `npm run test` - Run backend API tests (uses Vitest)
- `npx prisma studio` - Open Prisma GUI to inspect database (run from backend/)

### Backend Specific (run from `backend/` or use `--prefix backend`)
- `npm run dev` - Start Express server with TypeScript execution and watch mode (`tsx watch src/server.ts`)
- `npm run build` - Generate Prisma client and compile TypeScript to `dist/`
- `npm run start` - Run compiled production build from `dist/server.js`
- `npm run prisma:generate` - Generate Prisma client from schema
- `npm run prisma:push` - Push Prisma schema to database (development, no migration history)
- `npm run prisma:migrate` - Create and apply database migrations
- `npm run prisma:seed` - Seed database with initial data (Super Admin, demo clinic, etc.)
- `npm run db:check` - Verify database connectivity and schema status
- `npm run test` - Run Vitest-based API integration tests
- `npm run lint` - TypeScript type checking (`tsc --noEmit`)

### Frontend Specific (run from `frontend/` or use `--prefix frontend`)
- `npm run dev` - Start Vite development server with hot module replacement
- `npm run build` - TypeScript compile then Vite production build
- `npm run preview` - Preview production build locally
- `npm run test` - Run Vitest unit/component tests
- `npm run lint` - TypeScript type checking (`tsc --noEmit`)

### Environment Setup
1. Copy environment examples:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Configure `backend/.env`:
   - For local development: `DATABASE_URL="file:./dev.db"` (SQLite, no MySQL needed)
   - For production: Set MySQL connection string
   - Configure JWT secrets (change in production)
3. Configure `frontend/.env`:
   - `VITE_API_URL=http://localhost:5000/api` (adjust port if backend runs elsewhere)
4. Initialize database:
   ```bash
   cd backend
   npx prisma db push   # Creates tables
   npm run prisma:seed  # Adds Super Admin, demo clinic, doctors, etc.
   ```
5. Start development:
   ```bash
   # From root for both services
   npm run dev
   # Or separately in two terminals:
   # Terminal 1: npm run dev:backend
   # Terminal 2: npm run dev:frontend
   ```

## Development Guidelines

### Backend
- Follow existing module patterns in `src/modules/` when adding new features
- Use Prisma Client for all database operations (imported from `src/lib/prisma.ts`)
- Implement validation using Zod schemas (see existing examples in modules)
- Add new API endpoints following REST conventions under appropriate module routers
- Write tests in `__tests__` folders alongside source files or in dedicated test directories
- Error handling: Use try/catch blocks and send standardized error responses via `src/utils/response.ts`
- Middleware: Add custom middleware in `src/middlewares/` for cross-cutting concerns (auth, tenant isolation, etc.)

### Frontend
- Follow existing component patterns in `src/components/` and feature slices in `src/features/`
- Use React Query for data fetching and state management (see `src/lib/` for API hooks)
- Form handling: Use React Hook Form with Zod validation (see existing forms)
- Styling: Use Tailwind CSS utility classes; follow existing component styling patterns
- Routing: Add new routes in `src/routes/` with appropriate role-based access controls
- State management: Prefer React Query for server state; use React Context sparingly for global UI state
- Components: Create reusable, presentational components; keep business logic in feature slices or custom hooks

### Database
- Always refer to `data.md` and Prisma schema before making changes
- For local development, use SQLite (`DATABASE_URL="file:./dev.db"` in backend/.env)
- For schema changes:
  - Modify `backend/prisma/schema.prisma` (or `schema.mysql.prisma` for production)
  - Run `npx prisma db push` for development or `npx prisma migrate dev` for migration-based workflow
  - Update seed data in `prisma/seed.ts` if needed
- Never hardcode `clinicId` in queries; Prisma middleware automatically filters by tenant context
- Run `npm run prisma:seed` after significant schema changes to refresh test data

### Testing
- Backend tests: Use Vitest with Supertest for API integration tests (`backend/test/` directory)
- Frontend tests: Use Vitest with React Testing Library (`frontend/src/__tests__/` or alongside components)
- Run tests before submitting changes: `npm run test` (backend) and equivalent in frontend
- Mock external services and dependencies appropriately
- Test both positive and negative validation cases

### Documentation
- Update `data.md` if making significant database schema changes
- Update README.md or SETUP_GUIDE.md for major architectural changes
- Add JSDoc/TSDoc comments for complex functions and non-obvious logic
- Keep inline comments to explain why, not what (unless complex algorithms)

## Code Style
- Follow existing TypeScript/JavaScript conventions in the codebase
- Use meaningful, descriptive variable and function names
- Prefer const over let; avoid var
- Add comments for complex business logic or non-obvious implementations
- Ensure proper error handling in API endpoints and frontend service calls
- Use explicit return types for functions in TypeScript
- Follow ESLint and Prettier configurations (if present) - currently relying on TypeScript compiler for linting
- Keep functions focused and small; extract reusable logic to utilities or hooks

## Getting Started Quickly
1. Review `SETUP_GUIDE.md` for detailed setup instructions
2. Check `package.json` for dependency scripts and workspaces
3. Understand database schema via `data.md` and Prisma schema files
4. Run `npm run dev` from root to start both services
5. Access application at http://localhost:5173 (frontend) and http://localhost:5000 (backend API)
6. Use seeded credentials from `SETUP_GUIDE.md` or `data.md` for initial login

## Claude Code Specific Notes
- When implementing features, consider both frontend (UI/components) and backend (API/database) changes
- For bug fixes: Check backend logs (stdout from `npm run dev:backend`) and frontend console errors
- When optimizing performance: Examine database queries (Prisma Studio or query logging) and API response times
- Always maintain backward compatibility for public APIs unless explicitly instructed otherwise
- When working with multi-tenant features, verify tenant isolation is maintained in queries and API responses
- Remember that the backend runs on port 5000 and frontend on 5173 by default for local development