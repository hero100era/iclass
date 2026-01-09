# Backend Service

This directory contains the PostgreSQL database schema and the PostgREST configuration.

## Project Structure

- **`src/`**: Source code for Database Schema, RLS, and API definitions. See `src/README.md` for details.
- **`apply_schema.sh`**: Script to compile `src/` files and deploy them to the database.
- **`postgrest.conf`**: Configuration file for the PostgREST server.
- **`Makefile`**: Legacy makefile (deprecated in favor of `apply_schema.sh`).

## Setup & Running

### 1. Prerequisites
- PostgreSQL running locally.
- PostgREST installed.

### 2. Deploy Schema
Run the deployment script to build the database from source:
```bash
./apply_schema.sh
```

### 3. Run API Server
Start the PostgREST server using the configuration file:
```bash
postgrest postgrest.conf
```
