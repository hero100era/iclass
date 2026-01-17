# Backend PostgreSQL Tests

This directory contains unit tests for the PostgreSQL backend schemas, including `auth`, `iclass`, and `api`. The tests are written using **pgTAP**, a unit testing framework for PostgreSQL.

## Prerequisites

To run these tests, you need:
1.  **PostgreSQL** installed and running.
2.  **pgTAP** extension installed in your database.
3.  **pg_prove** (part of the `TAP::Parser::SourceHandler::pgTAP` Perl module) installed on your system.

## install pgtap
make sure that pgtap package installed on your system, then in order to install pgtap to postgresql, you need:
```bash
CREATE EXTENSION pgtap SCHEMA tap;
```

## Test Files

- `test_auth.sql`: Tests for the `auth` schema (users, password encryption, profiles).
- `test_iclass_data.sql`: Tests for the `iclass` schema data layer (tables, columns, constraints).
- `test_iclass_logic.sql`: Tests for the `iclass` schema logic (triggers, automated updates).
- `test_api.sql`: Tests for the `api` schema (JSON functions, integration with auth).

## Running Tests

### Using pg_prove (Recommended)

Run all tests from the `backend/iclass` directory:

```bash
pg_prove -d <database_name> tests/*.sql
```

Replace `<database_name>` with the name of your database (e.g., `iclass` or `mydb`).

### Using psql

You can run individual test files manually:

```bash
psql -d <database_name> -f tests/test_auth.sql
```

## Internal Mechanics

- **Isolation**: Each test file is wrapped in a transaction (`BEGIN; ... ROLLBACK;`). This ensures that the tests do not modify your actual data, as all changes are undone at the end.
- **TAP Output**: The tests produce output in the Test Anything Protocol (TAP) format, which is easily parsed by tools like `pg_prove`.  


