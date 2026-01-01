-- Table to store OAuth provider accounts linked to users
CREATE TABLE IF NOT EXISTS auth.oauth_accounts (
  pk serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES auth.users(pk) ON DELETE CASCADE,
  provider varchar(50) NOT NULL, -- 'github', 'discord', etc.
  provider_user_id varchar(255) NOT NULL, -- Unique ID from the provider
  provider_username varchar(255), -- Username from the provider (e.g., GitHub login, Discord username)
  provider_email varchar(255), -- Email from the provider (may be null for some providers)
  access_token text, -- Encrypted access token (optional, for future use)
  refresh_token text, -- Encrypted refresh token (optional, for future use)
  token_expires_at timestamp with time zone, -- When the access token expires
  scope text, -- Granted scopes from the provider
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id) -- Each provider account can only be linked once
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON auth.oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON auth.oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_user_id ON auth.oauth_accounts(provider, provider_user_id);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION auth.update_oauth_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_oauth_accounts_updated_at ON auth.oauth_accounts;
CREATE TRIGGER update_oauth_accounts_updated_at
  BEFORE UPDATE ON auth.oauth_accounts
  FOR EACH ROW
  EXECUTE PROCEDURE auth.update_oauth_accounts_updated_at();

-- Function to get or create user from OAuth provider
-- This is the main function that the frontend calls via PostgREST
CREATE OR REPLACE FUNCTION auth.oauth_login(
  provider varchar(50),
  provider_user_id varchar(255),
  email text,
  name varchar(255)
)
RETURNS TABLE(
  id integer,
  role varchar,
  category varchar
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id integer;
  v_user_record record;
BEGIN
  -- Start a transaction to ensure atomicity
  BEGIN
    -- Try to find existing oauth_account
    SELECT ao.user_id INTO v_user_id
    FROM auth.oauth_accounts ao
    WHERE ao.provider = oauth_login.provider
      AND ao.provider_user_id = oauth_login.provider_user_id;

    IF FOUND THEN
      -- OAuth account exists, get user info
      SELECT au.pk, au.role, au.category INTO v_user_record
      FROM auth.users au
      WHERE pk = v_user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'OAuth account exists but user not found';
      END IF;
    ELSE
      -- No oauth_account found, check if email exists
      IF email IS NOT NULL THEN
        SELECT au.pk INTO v_user_id
        FROM auth.users au
        WHERE au.email = oauth_login.email;

        IF FOUND THEN
          -- Email exists, link this OAuth account to the existing user
          INSERT INTO auth.oauth_accounts (
            user_id,
            provider,
            provider_user_id,
            provider_email
          ) VALUES (
            v_user_id,
            provider,
            provider_user_id,
            email
          );
        ELSE
          -- Email doesn't exist, create new user and oauth account
          -- Insert into auth.users with default values
          INSERT INTO auth.users (
            email,
            pass, -- OAuth users don't need a password, use random string
            role,
            category
          ) VALUES (
            email,
            encode(auth.gen_random_bytes(32), 'hex'), -- Random password hash
            'authenticator', -- Default role, change as needed
            'default' -- Default category, change as needed
          )
          RETURNING pk INTO v_user_id;

          -- Update display_name in employees or customers table if exists
          -- Note: This assumes the user might be an employee, adjust as needed
          -- UPDATE auth.employees
          -- SET display_name = name
          -- WHERE pk = v_user_id;

          -- Insert oauth_account
          INSERT INTO auth.oauth_accounts (
            user_id,
            provider,
            provider_user_id,
            provider_email
          ) VALUES (
            v_user_id,
            provider,
            provider_user_id,
            email
          );
        END IF;

        -- Get the final user record
        SELECT au.pk, au.role, au.category INTO v_user_record
        FROM auth.users au
        WHERE au.pk = v_user_id;
      ELSE
        -- No email provided and no existing oauth_account
        RAISE EXCEPTION 'Cannot create account without email address';
      END IF;
    END IF;

    -- Return user information
    RETURN QUERY
    SELECT
      v_user_record.pk AS id,
      v_user_record.role,
      v_user_record.category;

  EXCEPTION
    WHEN OTHERS THEN
      -- Re-raise the exception to rollback the transaction
      RAISE;
  END;
END;
$$;

-- Grant execute permission to admingrp (only frontend should call this)
-- GRANT EXECUTE ON FUNCTION auth.oauth_login TO admingrp;

-- Create a wrapper function in the api schema for cleaner API access
CREATE OR REPLACE FUNCTION api.oauth_login(
  provider varchar(50),
  provider_user_id varchar(255),
  email text,
  name varchar(255)
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  user_record record;
BEGIN
  -- Call the auth.oauth_login function
  SELECT * INTO user_record
  FROM auth.oauth_login(provider, provider_user_id, email, name);

  -- Convert to JSON
  SELECT row_to_json(r) INTO result
  FROM (
    SELECT
      user_record.id,
      user_record.role,
      user_record.category
  ) r;

  RETURN result;
END;
$$;

-- Grant execute permission to admingrp
GRANT EXECUTE ON FUNCTION api.oauth_login TO admingrp;

-- Additional utility function: Get OAuth accounts for a user
CREATE OR REPLACE FUNCTION auth.get_oauth_accounts(p_user_id integer)
RETURNS TABLE(
  provider varchar,
  provider_user_id varchar,
  provider_email varchar,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    oa.provider,
    oa.provider_user_id,
    oa.provider_email,
    oa.created_at
  FROM auth.oauth_accounts oa
  WHERE oa.user_id = p_user_id;
END;
$$;

-- GRANT EXECUTE ON FUNCTION auth.get_oauth_accounts TO authenticator;

-- Additional utility function: Unlink an OAuth account
CREATE OR REPLACE FUNCTION auth.unlink_oauth_account(
  p_user_id integer,
  provider varchar(50)
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.oauth_accounts
  WHERE user_id = p_user_id
    AND provider = provider;

  RETURN FOUND;
END;
$$;

-- GRANT EXECUTE ON FUNCTION auth.unlink_oauth_account TO authenticator;
