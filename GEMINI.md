# iClass Agent Guidelines

Maritime vessel certification system. React Router v7 + PostgREST.

## Architecture
- **Database**: 3-schema model.
  - `auth`: JWT, OAuth2, and user/session management.
  - `iclass`: Core business logic, tables (ships, jobs, surveys), and RLS.
  - `api`: Secure views and functions (RPCs) exposed via PostgREST.
- **Frontend**: RRv7 with SPA mode. Server-side logic for API proxying and sessions.

## Tech & Setup
- **Frontend**: RRv7, TS, Tailwind v4, shadcn/ui.
- **Backend**: PostgreSQL 16+, PostgREST, JWT/OAuth2.
- **Dev**: Docker, `frontend` (5173), `api` (2000), `db` (5432).

## Database Workflow
1. **Source Files**: All SQL is in `backend/src/`.
   - `auth/`: Auth schema.
   - `data/`: Tables, Enums, Domains.
   - `logic/`: RLS, Triggers, Indexes, Core functions.
   - `api/`: API schema (views and RPCs).
2. **Apply Schema**: Run `./apply_schema.sh` in `/backend` to rebuild the DB.
   - This script concatenates files in a specific order (Schemas -> Auth -> Data -> Tables -> Logic -> API).
   - **Warning**: This drops and recreates the database. Use with care.
3. **Types**: After schema changes, regenerate types using `bun run typegen` in `frontend/`.
   - **Note**: Ensure `DATABASE_URL` is set in your environment (e.g., `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`).
4. **Testing**: pgTAP in `backend/tests/`.
   - Run all: `pg_prove -d <db> backend/tests/*.sql`
   - Run one: `pg_prove -d <db> backend/tests/test_file.sql`

## Frontend Standards
- **API Access**: Use `const db = await getDb(request)` in loaders/actions.
  - Located in `~/ .server/lib/api.ts`.
- **Filtering**: Use the `filter` helper from `~/ .server/lib/api.ts`.
  - Example: `filters: { status: filter.eq('active'), name: filter.ilike('*test*') }`.
- **Requests**:
  - `db.get<T[]>(path, options)`: Returns array.
  - `db.getOne<T>(path, options)`: Returns single object (adds `Accept: single-json`).
  - `db.rpc<T>(name, options)`: Calls PostgreSQL function.
- **Imports**: 1) External, 2) `~/` (absolute), 3) `./` (relative).
- **Components**: Functional, PascalCase. Use `cn()` & `~/components/ui/DetailHelpers`.
- **Naming**: Components: PascalCase, Functions: camelCase, Routes: kebab-case.

## Common Tasks
- **Add Table**: Create in `backend/src/data/tables/XXX_name.sql`. Run `apply_schema.sh`.
- **Add RPC**: Create in `backend/src/api/functions/name.sql`. Run `apply_schema.sh`.
- **Add Route**: Define in `frontend/app/routes.ts`. Create file in `frontend/app/routes/`.
- **Update Types**: (Optional) If you added tables, update `frontend/app/definitions/database.iclass.types.ts`.

## General
- No redundant comments.
- Always run `bun run typecheck` and `eslint .` after frontend changes.
- Auth: JWT-based sessions, auto-refreshed via middleware.
