BEGIN;
SELECT plan(4);

-- 1. Check if api schema exists
SELECT has_schema('api', 'Schema api should exist');

-- 2. Check if api.user_profile function exists
SELECT has_function('api', 'user_profile', ARRAY['text', 'text'], 'Function api.user_profile should exist');

-- 3. Test api.user_profile with valid credentials
-- First insert a user in auth.users
INSERT INTO auth.users (email, pass, role, category) 
VALUES ('api_test@example.com', 'apipass', 'employees', 'internal');

SELECT results_eq(
    'SELECT api.user_profile(''api_test@example.com'', ''apipass'')::text',
    'SELECT row_to_json(r)::text FROM (SELECT pk as id, role, category FROM auth.users WHERE email = ''api_test@example.com'') r',
    'api.user_profile should return user data as JSON for valid credentials'
);

-- 4. Test api.user_profile with invalid credentials
SELECT is(
    (SELECT api.user_profile('api_test@example.com', 'wrongpass'))::text,
    NULL::text,
    'api.user_profile should return NULL for invalid credentials'
);

SELECT * FROM finish();
ROLLBACK;
