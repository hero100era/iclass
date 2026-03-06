CREATE TABLE IF NOT EXISTS auth.user(
  id serial PRIMARY KEY,
  email text CHECK (email ~* '^.+@.+\..+$') UNIQUE NOT NULL,
  password_hash varchar(512) NOT NULL,
  role varchar(64) NOT NULL,
  category varchar(32) NOT NULL,
  is_active boolean DEFAULT TRUE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  last_active timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION auth.check_role_exists()
  RETURNS TRIGGER
  AS $$
BEGIN
  IF NOT EXISTS(
    SELECT
      1
    FROM
      pg_roles AS r
    WHERE
      r.rolname = NEW.role) THEN
  RAISE foreign_key_violation
  USING message = 'unknown database role: ' || NEW.role;
  RETURN NULL;
END IF;
  RETURN new;
END
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_users_role_exists ON auth.user;
CREATE CONSTRAINT TRIGGER ensure_users_role_exists
  AFTER INSERT OR UPDATE ON auth.user FOR EACH ROW
  EXECUTE PROCEDURE auth.check_role_exists();

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA auth;

CREATE OR REPLACE FUNCTION auth.encrypt_password_hash()
  RETURNS TRIGGER
  AS $$
BEGIN
  IF tg_op = 'INSERT' OR NEW.password_hash <> OLD.password_hash THEN
    NEW.password_hash = auth.crypt(NEW.password_hash, auth.gen_salt('bf', 10));
  END IF;
  RETURN new;
END
$$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS encrypt_password_hash ON auth.user;
CREATE TRIGGER encrypt_password_hash
  BEFORE INSERT OR UPDATE ON auth.user FOR EACH ROW
  EXECUTE PROCEDURE auth.encrypt_password_hash();

CREATE OR REPLACE FUNCTION auth.user_profile(email text, password text)
  RETURNS TABLE(
    id integer,
    ROLE varchar,
    category varchar
  )
  AS $$
BEGIN
  RETURN query
  SELECT
    u.id,
    u.role,
    u.category
  FROM
    auth.user u
  WHERE
    u.email = user_profile.email
    AND u.password_hash = auth.crypt(user_profile.password, u.password_hash)
    AND u.is_active = TRUE;
END;
$$
LANGUAGE plpgsql;

-- the below should be on your exposed schema
-- CREATE SCHEMA IF NOT EXISTS api AUTHORIZATION admingrp;

CREATE OR REPLACE FUNCTION api.user_profile(email text, password text)
  RETURNS TABLE(id integer, role varchar, category varchar)
  AS $$
BEGIN
  RETURN QUERY
  SELECT
    *
  FROM
    auth.user_profile(email, password);
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;


GRANT usage ON SCHEMA api TO anonymous;

GRANT EXECUTE ON FUNCTION api.user_profile TO anonymous;

-- below is not needed if we don't use postgres to manage the jwt tokens.
-- First ensure the pgjwt extension is available and installed
-- CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA auth;

-- -- below is the function to generate the jwt token
-- DROP TYPE IF EXISTS auth.jwt_token;
-- CREATE TYPE auth.jwt_token AS (
--   token text,
--   exp integer
-- );

-- CREATE OR REPLACE FUNCTION api.login(email text, password text)
--   RETURNS auth.jwt_token
--   AS $$
-- DECLARE
--   user_record record;
--   result auth.jwt_token;
--   jwt_secret text;
--   jwt_expire_seconds integer;
-- BEGIN
--   -- check email and password
--   jwt_secret := current_setting('app.settings.jwt_secret', TRUE);
--   jwt_expire_seconds := current_setting('app.settings.jwt_expire_seconds', TRUE)::integer;
--   SELECT
--     *
--   FROM
--     auth.user_profile(email, password) INTO user_record;
--   IF user_record IS NULL THEN
--     RAISE invalid_password
--     USING message = 'invalid users or password';
--   END IF;
--     SELECT
--       sign(row_to_json(r), jwt_secret) AS token,
--       exp
--     FROM (
--       SELECT
--         user_record.role AS role,
--         email,
--         user_record.category AS category,
--         extract(epoch FROM now())::integer + jwt_expire_seconds AS exp) r INTO result;
--     RETURN result;
-- END;
-- $$
-- LANGUAGE plpgsql
-- SECURITY DEFINER;

-- CREATE OR REPLACE FUNCTION api.verify_token(token text)
--   RETURNS TABLE(
--     header json,
--     payload json,
--     valid boolean
--   )
--   AS $$
-- DECLARE
--   jwt_secret text;
-- BEGIN
--   jwt_secret := current_setting('app.settings.jwt_secret', TRUE);
--   RETURN query
--   SELECT
--     *
--   FROM
--     verify(token, jwt_secret);
-- END;
-- $$
-- LANGUAGE plpgsql
-- SECURITY DEFINER;

-- GRANT EXECUTE ON FUNCTION api.login TO anonymous;
