BEGIN;
SET search_path TO tap, public, iclass, auth, api;
SELECT plan(3);

-- 1. Setup test user and role-specific data
INSERT INTO iclass.flags (code, name, fullname) VALUES ('SGP', 'Singapore', 'Republic of Singapore');

INSERT INTO auth.users (id, email, password_hash, role, category) 
VALUES (999, 'service_test@example.com', 'pass', 'employees', 'internal');

INSERT INTO iclass.organizations (id, name) VALUES (1, 'Test Org');
INSERT INTO iclass.locations (id, organization_id, name) VALUES (1, 1, 'Test Office');
INSERT INTO iclass.employees (user_id, organization_id, first_name, last_name, display_name, location_id, email)
VALUES (999, 1, 'Service', 'User', 'Service Test User', 1, 'service_test@example.com');

-- 2. Mock iclass.get_auth_user_id() to return our test user
CREATE OR REPLACE FUNCTION iclass.get_auth_user_id() RETURNS integer AS $$
BEGIN
  RETURN 999;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Test api.me view
SELECT results_eq(
    'SELECT display_name, location FROM api.me',
    'SELECT ''Service Test User''::varchar, ''Test Office''::varchar',
    'api.me should return data from iclass.employees for employees'
);

-- 4. Test for administrations role
UPDATE auth.users SET role = 'administrations' WHERE id = 999;
INSERT INTO iclass.flag_staff (id, name, flag_code)
VALUES (999, 'Flag Officer', 'SGP');

SELECT results_eq(
    'SELECT display_name, location FROM api.me',
    'SELECT ''Flag Officer''::varchar, ''Administration''::varchar',
    'api.me should return data from iclass.flag_staff and hardcoded location for administrations'
);

-- 5. Test for customers role
UPDATE auth.users SET role = 'customers' WHERE id = 999;
INSERT INTO iclass.customers (id, name)
VALUES (999, 'Customer User');

SELECT results_eq(
    'SELECT display_name, location FROM api.me',
    'SELECT ''Customer User''::varchar, ''External''::varchar',
    'api.me should return data from iclass.customers and hardcoded location for customers'
);

SELECT * FROM finish();
ROLLBACK;
