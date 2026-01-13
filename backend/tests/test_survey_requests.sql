BEGIN;
SET search_path TO tap, public, iclass, auth, api;
SELECT tap.plan(6);

-- Setup
INSERT INTO iclass.organizations (id, name) VALUES (9001, 'Owner Org'), (9002, 'Other Org');
INSERT INTO iclass.flags (code, name, fullname) VALUES ('SGP', 'Singapore', 'Republic of Singapore'), ('GRC', 'Greece', 'Hellenic Republic');

INSERT INTO iclass.ships (id, name, imo_number, registered_owner_id, flag_code, type_iacs) 
VALUES (9001, 'Our Ship', '1111111', 9001, 'SGP', 'ZZ'),
       (9002, 'Other Ship', '2222222', 9002, 'GRC', 'ZZ'),
       (9003, 'Flag Ship', '3333333', 9002, 'SGP', 'ZZ');

INSERT INTO auth.users (id, email, password_hash, role, category) 
VALUES (9101, 'customer@owner.com', 'pass', 'customers', 'external'),
       (9102, 'employee@iclass.com', 'pass', 'employees', 'internal'),
       (9103, 'staff@sgp.com', 'pass', 'administrations', 'external');

INSERT INTO iclass.customers (id, name, company_id) VALUES (9101, 'Owner User', 9001);
INSERT INTO iclass.employees (user_id, organization_id, first_name, last_name, display_name, email)
VALUES (9102, 9001, 'ICLASS', 'Staff', 'ICLASS Staff', 'employee@iclass.com');
INSERT INTO iclass.flag_staff (id, name, flag_code) VALUES (9103, 'SGP Officer', 'SGP');

GRANT USAGE ON SCHEMA tap TO employees, customers, administrations;
GRANT SELECT ON ALL TABLES IN SCHEMA tap TO employees, customers, administrations;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tap TO employees, customers, administrations;

GRANT USAGE ON SCHEMA iclass TO employees, customers, administrations;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA iclass TO employees;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA iclass TO customers;
GRANT SELECT ON ALL TABLES IN SCHEMA iclass TO administrations;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA iclass TO employees, customers;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA iclass TO employees, customers, administrations;

-- Insert some requests
INSERT INTO iclass.survey_requests (id, ship_id, company_id, location, status)
VALUES (9001, 9001, 9001, 'SGP Port', 'draft'), -- Own
       (9002, 9002, 9002, 'GRC Port', 'draft'), -- Other
       (9003, 9003, 9002, 'SGP Port', 'draft'); -- Flag Ship but Other Company

INSERT INTO iclass.survey_request_carts (ship_id, company_id, survey_request_id)
VALUES (9001, 9001, 9001),
       (9002, 9002, 9002),
       (9003, 9002, 9003);

-- Mock function to switch users easily
CREATE OR REPLACE FUNCTION iclass.get_auth_user_id() RETURNS integer AS $$
DECLARE
    _user_id integer;
BEGIN
    _user_id := current_setting('test.user_id', true)::integer;
    RETURN _user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test 1: Customer (Company 1) sees only request 1
SET test.user_id = '9101';
SET ROLE customers;
SELECT tap.results_eq(
    'SELECT id FROM iclass.survey_requests WHERE id >= 9000'::text,
    'SELECT 9001'::text,
    'Customer should only see their own survey requests'::text
);

SELECT tap.results_eq(
    'SELECT survey_request_id FROM iclass.survey_request_carts WHERE survey_request_id >= 9000'::text,
    'SELECT 9001'::text,
    'Customer should only see their own cart items'::text
);

-- Test 2: Employee sees all requests
RESET ROLE;
SET test.user_id = '9102';
SET ROLE employees;
SELECT tap.is(
    (SELECT count(*)::integer FROM iclass.survey_requests WHERE id >= 9001),
    3,
    'Employee should see all survey requests'
);

-- Test 3: Administration (SGP) sees requests for ship 1 and 3
RESET ROLE;
SET test.user_id = '9103';
SET ROLE administrations;
SELECT tap.results_eq(
    'SELECT id FROM iclass.survey_requests WHERE id >= 9001 ORDER BY id'::text,
    'SELECT id FROM (VALUES (9001), (9003)) AS t(id)'::text,
    'Administration should see requests for ships under their flag'::text
);

-- Test 4: Customer can insert into their own request
RESET ROLE;
SET test.user_id = '9101';
SET ROLE customers;
SELECT tap.lives_ok(
    'INSERT INTO iclass.survey_requests (ship_id, company_id, location) VALUES (9001, 9001, ''New Location'')',
    'Customer can insert survey request for their own ship'
);

-- Test 5: Customer cannot insert into other's request
SELECT tap.throws_ok(
    'INSERT INTO iclass.survey_requests (ship_id, company_id, location) VALUES (9002, 9002, ''Illegal'')',
    NULL, -- RLS error
    'Customer cannot insert survey request for someone else''s ship'
);

SELECT * FROM tap.finish();
ROLLBACK;
