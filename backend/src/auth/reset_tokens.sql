-- Create the reset_tokens table
DROP TABLE IF EXISTS auth.reset_token;
CREATE TABLE auth.reset_token (
  id serial PRIMARY KEY,
  token UUID NOT NULL DEFAULT uuidv7(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  used BOOLEAN DEFAULT FALSE
);

-- Index for faster lookups
CREATE INDEX idx_reset_tokens_token ON auth.reset_token(token);
CREATE INDEX idx_reset_tokens_email ON auth.reset_token(email);

-- Function to request a password reset
CREATE OR REPLACE FUNCTION auth.request_password_reset(email_arg TEXT)
RETURNS UUID AS $$
DECLARE
    new_token UUID;
BEGIN
    -- Check if the user exists
    IF NOT EXISTS (SELECT 1 FROM auth.user WHERE email = email_arg) THEN
        -- Return null or raise error? Returing null to avoid enumeration attacks effectively
        -- But for now, let's just return NULL. The frontend can say "If that email exists..."
        RETURN NULL;
    END IF;

    -- Invalidate existing unused tokens for this email (optional, but good hygiene)
    UPDATE auth.reset_token
    SET used = TRUE
    WHERE email = email_arg AND used = FALSE;

    -- Insert new token
    INSERT INTO auth.reset_token (email)
    VALUES (email_arg)
    RETURNING token INTO new_token;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset the password
CREATE OR REPLACE FUNCTION auth.reset_password(token_arg UUID, new_pass_arg TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO token_record
  FROM auth.reset_token
  WHERE token = token_arg AND used = FALSE AND expires_at > NOW();

  IF token_record IS NULL THEN
      RETURN FALSE;
  END IF;

    -- Update the user's password
    -- Note: auth.user trigger encrypt_pass handles hashing
  UPDATE auth.user
  SET password_hash = new_pass_arg
  WHERE email = token_record.email;

  -- Mark token as used
  UPDATE auth.reset_token
  SET used = TRUE
  WHERE id = token_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
