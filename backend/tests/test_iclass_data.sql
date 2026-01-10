BEGIN;
SET search_path TO tap, public, iclass, auth;
SELECT plan(6);

-- 1. Check if iclass schema exists
SELECT has_schema('iclass', 'Schema iclass should exist');

-- 2. Check if iclass.employees table exists
SELECT has_table('iclass', 'employees', 'Table iclass.employees should exist');

-- 3. Check columns in iclass.employees
SELECT has_column('iclass', 'employees', 'id', 'Column iclass.employees.id should exist');
SELECT has_column('iclass', 'employees', 'display_name', 'Column iclass.employees.display_name should exist');

-- 4. Check if iclass.customers table exists
SELECT has_table('iclass', 'customers', 'Table iclass.customers should exist');

-- 5. Test foreign key constraint for employees
-- Ensure that we can't insert an employee without a corresponding auth user
INSERT INTO iclass.organizations (id, name) VALUES (999, 'Test Org');

SELECT throws_ok(
    'INSERT INTO iclass.employees (user_id, organization_id, first_name, last_name, email, display_name) 
     VALUES (999999, 999, ''Ghost'', ''Employee'', ''ghost@example.com'', ''Ghost Employee'')',
    'insert or update on table "employees" violates foreign key constraint "employees_user_id_fkey"',
    'Should throw error when inserting employee with non-existent auth user'
);

SELECT * FROM finish();
ROLLBACK;
