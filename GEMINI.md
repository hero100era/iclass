# iClass Agent Guidelines

Maritime vessel certification system. React Router v7 + PostgREST.

## Tech & Setup
- **Frontend**: RRv7, TS, Tailwind v4, shadcn/ui.
- **Backend**: PostgreSQL (schemas: auth, iclass, api), PostgREST, JWT/OAuth2.
- **Dev**: Docker, `frontend` (5173), `api` (2000), `db` (5432).

## Commands
```bash
# Frontend (in /frontend)
bun run dev | build | start | typecheck | eslint .
# Backend (in /backend)
./apply_schema.sh (reset db) | postgrest postgrest.conf
pg_prove -d <db> tests/*.sql (pgTAP tests)
# Docker
docker-compose up -d | down
```

## Frontend Standards
- **Imports**: 1) External, 2) `~/` (absolute), 3) `./` (relative).
- **Types**: `type` for shapes, `interface` for props. Use RRv7 `Route` generics for loaders/actions.
- **Components**: Functional, PascalCase. Use `cn()` & `~/components/ui/DetailHelpers`.
- **Naming**: Components: PascalCase, Functions: camelCase, Routes: kebab-case.
- **API**: `const db = await getDb(request)`. Methods: `get`, `getOne`, `post`, `patch`, `rpc`.
- **Errors**: Check `res.ok`, use `isRouteErrorResponse` and `fetcher.data?.error`.

## Backend Standards
- **SQL**: Schema order: `auth` -> `iclass` -> `api`. Use `SECURITY DEFINER` for auth wrappers.
- **Naming**: `snake_case` (singular tables). Functions schema-prefixed (e.g., `api.user_profile`).
- **Style**: Use `$$` bodies, explicit returns, `jsonb` for API responses.
- **Testing**: pgTAP in `backend/tests/`. Wrap in `BEGIN; ... ROLLBACK;`.

## General
- No redundant comments.
- Always run `bun run typecheck` and `eslint .` after frontend changes.
- Auth: JWT-based sessions, auto-refreshed via middleware.
