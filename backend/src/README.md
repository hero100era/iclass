# Database Source Code (`src/`)

This directory contains the SQL source code for the PostgREST API and the underlying PostgreSQL database schema. The code is organized by function rather than by object type to maintain a clean separation of concerns.

## Directory Structure

### `data/`
**The Foundation.**
This directory contains the definitions for the physical database schema.
- **Enums & Domains**: Custom data types.
- **`tables/`**: Table definitions (`001_...`, `002_...`). This is the source of truth for the database structure.

### `auth/`
**Authentication & Authorization.**
Handles the database-level security and user identity.
- **`roles.sql`**: Definitions of database roles (e.g., `employees`, `customers`, `administrations`).
- **`jwt.sql`**: Logic for handling JSON Web Tokens and user profiles.

### `logic/`
**Business Logic & Security.**
Contains the rules that govern data access and manipulation.
- **`rls_policies.sql`**: Row Level Security policies that restrict which rows a user can see or edit.
- **`triggers/`**: Automated database actions (e.g., updating timestamps).
- **`privileges/`**: Scripts that grant specific permissions to database roles.

### `api/`
**The Public Interface.**
This acts as the "Controller" layer for PostgREST.
- **Views**: Virtual tables that expose data to the API, often filtering or formatting it for consumption.
- **Functions**: Stored procedures exposed as RPC endpoints.

### `utilities/`
**Helper Scripts.**
- **`create_schemas.sql`**: Setup scripts to initialize the database environment.
- Miscellaneous tools and playground scripts.
