BEGIN;
SELECT plan(8);

-- 1. Check if auth schema exists
SELECT has_schema('auth', 'Schema auth should exist');

-- 2. Check if auth.users table exists
SELECT has_table('auth', 'users', 'Table auth.users should exist');

-- 3. Check columns in auth.users
SELECT has_column('auth', 'users', 'id', 'Column auth.users.id should exist');
SELECT has_column('auth', 'users', 'email', 'Column auth.users.email should exist');
SELECT has_column('auth', 'users', 'pass', 'Column auth.users.pass should exist');

-- 4. Test password encryption trigger
-- We need to insert a user and check if the password is encrypted (not equal to the input)
INSERT INTO auth.users (email, pass, role, category) 
VALUES ('test@example.com', 'mypassword', 'employees', 'internal');

SELECT isnt(
    (SELECT pass FROM auth.users WHERE email = 'test@example.com'),
    'mypassword',
    'Password should be encrypted by the trigger'
);

-- 5. Test auth.user_profile function
SELECT results_eq(
    'SELECT id, role, category FROM auth.user_profile(''test@example.com'', ''mypassword'')',
    'SELECT id, role, category FROM auth.users WHERE email = ''test@example.com''',
    'auth.user_profile should return correct user data for valid credentials'
);

-- 6. Test auth.user_profile with invalid password
SELECT is_empty(
    'SELECT * FROM auth.user_profile(''test@example.com'', ''wrongpass'')',
    'auth.user_profile should return nothing for invalid password'
);

SELECT * FROM finish();
ROLLBACK;
