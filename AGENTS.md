# Agent Guidelines for iClass

## Project Overview

iClass is a maritime vessel certification and management system. It uses a **React Router v7** frontend and a **PostgreSQL + PostgREST** backend.

- **Frontend**: React Router v7, TypeScript, Tailwind CSS v4, shadcn/ui.
- **Backend**: PostgreSQL (multi-schema: `auth`, `iclass`, `api`), PostgREST, JWT Auth.
- **DevOps**: Docker, Nginx.

## Build, Test, and Lint Commands

### Frontend (React Router)
```bash
# Development
cd frontend
bun run dev              # Start dev server on port 5173
bun run build            # Build for production
bun run start            # Start production server
bun run typecheck        # Run TypeScript compiler (react-router typegen + tsc)

# Run ESLint
bun run eslint .             # Lint all files
bun run eslint frontend/app/routes/vessels/index.tsx  # Lint single file

# Testing (if test framework is added)
# bun test              # Run tests (when configured)
```

### Backend (PostgreSQL + PostgREST)
```bash
# Deploy schema to database
cd backend && ./apply_schema.sh

# Run PostgREST API
cd backend && postgrest postgrest.conf

# Run tests with pgTAP
cd backend
pg_prove -d <database_name> tests/*.sql
pg_prove -d <database_name> tests/test_auth.sql  # Single test
psql -d <database_name> -f tests/test_api.sql    # Manual run

# Docker services
docker-compose up        # Start all services (web, api, db)
docker-compose up -d     # Start in background
docker-compose down      # Stop and remove containers
```

## Frontend Code Style

### Imports
Order: 1) External libraries, 2) Absolute imports (~/), 3) Relative imports (./)
```typescript
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Search, Plus } from "lucide-react";
import { getDb } from "~/.server/lib/api";
import { Pagination } from "~/components/Pagination";
import type { Route } from "./+types/index";
```

### TypeScript & Types
- Use `type` for object shapes, `interface` for component props
- Always use generics from `import type { Route } from "./+types/route"`
- Explicit return types for loader/action functions
```typescript
export async function loader({ request }: Route.LoaderArgs): Promise<{ vessels: any[] }> { ... }
export function CartDrawer({ vesselId, companyId }: Route.ComponentProps): JSX.Element { ... }
```

### Components
- Functional components only, export named components
- Props interface defined above component
- Use `cn()` utility for conditional Tailwind classes
```typescript
export function CartDrawer({ vesselId, companyId }: Route.ComponentProps) {
    return <div className={cn("base-class", isActive && "active-class")}>...</div>;
}
```

### Naming Conventions
- Components: PascalCase (`CartDrawer`, `Sidebar`)
- Functions: camelCase (`handleSubmit`, `removeItem`)
- Constants: UPPER_SNAKE_CASE (rarely needed)
- Routes: lowercase with hyphens (`/vessels/detail`, `/forgot-password`)

### API Calls
Use `getDb(request)` from `~/.server/lib/api` to get a database client that auto-injects JWT tokens and supports PostgREST filtering/ordering.
```typescript
const db = await getDb(request);
const { data, count } = await db.get('/ships', {
  select: 'id,name',
  filters: { is_active: 'eq.true' }
});
const { data: newShip } = await db.post('/ships', { body: { name: "Value" } });
```

### Error Handling
- Always check `res.ok` before JSON parsing
- Use `isRouteErrorResponse` in ErrorBoundary components
- Use `fetcher.data?.error` for form submission errors

### Styling
- Tailwind CSS v4 with CSS-based configuration (no separate config file)
- shadcn/ui components from `~/components/ui`
- Use Tailwind's `animate-in` for animations
- Custom components follow shadcn patterns (variants with class-variance-authority)

## Backend Code Style

### SQL File Structure
- Schema order: `auth` (private), `iclass` (data), `api` (public)
- Functions use SECURITY DEFINER for auth wrappers
- Views for exposing data in `api` schema
- RLS policies on underlying tables

### Naming
- Tables: snake_case singular (`auth.user`, `iclass.ship`)
- Columns: snake_case (`password_hash`, `created_at`)
- Functions: snake_case with schema prefix (`api.user_profile`, `auth.check_role_exists`)
- Roles: lowercase with underscores (`admingrp`, `employees`)

### SQL Conventions
- Use `$$` for function bodies, not dollar quotes with names
- DROP IF EXISTS ... CASCADE when redefining
- Always declare function return types explicitly
- Use `json` or `jsonb` for API responses
- Wrap test files in `BEGIN; ... ROLLBACK;`
- Use `SELECT plan(N)` and `SELECT * FROM finish()` for pgTAP tests

### Testing
- Test files in `backend/tests/` directory
- Use `has_schema()`, `has_function()`, `results_eq()`, `is()` pgTAP functions
- Test both success and failure paths

## General Guidelines
- No comments unless essential for complex logic
- Always run `bun run typecheck` after changes
- Follow existing patterns in similar components
- Use `process.env.API_URL` for API endpoint (default: http://localhost:2000)
- Session tokens stored in JWT format, auto-refreshed via middleware
- Docker runs services: web (5173), api (2000), db (5432)
