-- Wrapper for requesting password reset (Returns token, restricted to admin/service)
CREATE OR REPLACE FUNCTION api.request_password_reset(email text)
RETURNS json AS $$
DECLARE
    token uuid;
BEGIN
    token := auth.request_password_reset(email);
    -- Return as JSON
    RETURN json_build_object('token', token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper for resetting password (Public)
CREATE OR REPLACE FUNCTION api.reset_password(token uuid, new_password text)
RETURNS boolean AS $$
BEGIN
    RETURN auth.reset_password(token, new_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION api.reset_password(uuid, text) TO anonymous;

-- DO NOT GRANT request_password_reset TO anonymous!
-- Only grant to admingrp (or whatever role the backend uses)
-- Assuming 'admingrp' exists (defined in roles.sql)
GRANT EXECUTE ON FUNCTION api.request_password_reset(text) TO admingrp;
