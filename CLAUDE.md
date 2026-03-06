# CLAUDE.md This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

iClass is a maritime vessel certification and management system. It uses a React Router v7 frontend with a PostgreSQL + PostgREST backend.

## Architecture Overview

### Frontend (React Router v7)
- **Path**: `frontend/`
- **Framework**: React Router v7 with SSR, TypeScript, Tailwind CSS v4
- **Key directories**:
  - `app/.server/` - Server-side utilities (API calls, sessions, JWT, OAuth)
  - `app/routes/` - Route components (login, vessels, surveys, admin, etc.)
  - `app/components/` - Reusable UI components
  - `app/definitions/` - TypeScript type definitions
- **API utilities**: Use `getDb` from `~/.server/lib/api` to get a database client (`db = await getDb(request)`) that auto-injects JWT tokens from session and provides methods like `db.get()`, `db.post()`, `db.patch()`, `db.delete()`, `db.rpc()`.

### Backend (PostgreSQL + PostgREST)
- **Path**: `backend/`
- **Multi-schema architecture**:
  - `auth` (private) - User authentication, OAuth, JWT handling
  - `iclass` (private) - Maritime data tables, triggers, RLS policies
  - `api` (public) - Views and functions exposed via PostgREST
  - `tap` (private) - pgTAP testing framework
- **Schema deployment**: `./apply_schema.sh` assembles all SQL files and deploys to database

### Database Role Hierarchy
- `admingrp` - Database administrators
- `authenticator` - PostgREST connection role (switches to user roles)
- `anonymous` - Unauthenticated access
- `employees`, `customers`, `administrations` - User type groups
- Specialized roles: `surveyors`, `auditors`, `managers`, `hr`, `finance` (with senior/director levels)

## Commands

### Frontend
```bash
cd frontend
bun run dev        # Start dev server (http://localhost:5173)
bun run build      # Production build
bun run start      # Serve production build
bun run typecheck  # TypeScript check (react-router typegen + tsc)
bunx eslint .       # Run ESLint
```

### Backend
```bash
cd backend
./apply_schema.sh              # Deploy schema to database
postgrest postgrest.conf       # Run PostgREST API server (port 2000)
pg_prove -d <db> tests/*.sql   # Run pgTAP tests
psql -d <db> -f tests/test_auth.sql  # Run single test file
```

### Docker
```bash
docker-compose up -d    # Start all services (web, api, db)
docker-compose down     # Stop containers
```

## Key Patterns

### Frontend Imports
Order: 1) External libraries, 2) Absolute imports (`~/`), 3) Relative imports
```typescript
import { useFetcher } from "react-router";
import { getDb } from "~/.server/lib/api";
import { Pagination } from "~/components/Pagination";
import type { Route } from "./+types/index";
```

### Route Components
Use typed loader/action args and ComponentProps:
```typescript
export async function loader({ request }: Route.LoaderArgs): Promise<{ vessels: any[] }> { ... }
export function Component({ vesselId }: Route.ComponentProps) { ... }
```

### Backend SQL
- Tables in `iclass` schema, exposed via `api` schema views
- Views use `SECURITY BARRIER` and respect RLS policies
- Functions use `SECURITY DEFINER` for auth wrappers
- Test files wrapped in `BEGIN; ... ROLLBACK;`

### Session Management
- JWT tokens stored in HTTP-only cookies via `createCookieSessionStorage`
- Session contains: `token`, `oAuthState`, `codeVerifier`
- 1-hour session expiry, auto-refreshed via middleware

## Environment Variables

Frontend (`frontend/.env.development`):
- `API_URL` - PostgREST endpoint (default: http://localhost:2000)
- `SECRET_KEY` - Session encryption key
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` - Discord OAuth
- `OAUTH_REDIRECT_URL_BASE` - OAuth callback base URL

Backend (`backend/apply_schema.sh` defaults), don't use apply_schema.sh to apply database changes, this will be applied mannually through a special role:
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `DB_HOST`, `DB_PORT`
