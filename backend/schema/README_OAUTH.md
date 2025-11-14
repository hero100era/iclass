# OAuth Authentication Implementation Guide

## Overview
This document describes the OAuth 2.0 authentication implementation for the iClass application using PostgREST.

## Supported OAuth Providers
- **GitHub** - OAuth 2.0 with PKCE
- **Discord** - OAuth 2.0 with PKCE

## Database Schema

### Table: `auth.oauth_accounts`
This table stores OAuth provider account information linked to local user accounts.

```sql
CREATE TABLE auth.oauth_accounts (
  pk serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES auth.users(pk) ON DELETE CASCADE,
  provider varchar(50) NOT NULL, -- 'github', 'discord', etc.
  provider_user_id varchar(255) NOT NULL, -- Unique ID from the provider
  provider_username varchar(255), -- Username from the provider
  provider_email varchar(255), -- Email from the provider
  access_token text, -- Encrypted access token
  refresh_token text, -- Encrypted refresh token
  token_expires_at timestamp with time zone, -- Token expiration time
  scope text, -- Granted scopes
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);
```

### Indexes
```sql
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE INDEX idx_oauth_accounts_provider_user_id ON oauth_accounts(provider, provider_user_id);
```

## PostgRPC Functions

### Function: `api.oauth_login`
This is the main function called by the frontend during OAuth callback.

**Signature:**
```sql
api.oauth_login(
  p_provider varchar(50),
  p_provider_user_id varchar(255),
  p_email text,
  p_name varchar(255)
) RETURNS json
```

**Parameters:**
- `p_provider`: OAuth provider name ('github' or 'discord')
- `p_provider_user_id`: Unique user ID from the OAuth provider
- `p_email`: User's email from the OAuth provider
- `p_name`: User's display name from the OAuth provider

**Returns:**
```json
{
  "id": 123,
  "role": "user",
  "category": "default"
}
```

**Behavior:**
1. Checks if OAuth account already exists for the provider
2. If exists: Returns existing user's information
3. If not exists:
   - Checks if email already exists in `auth.users`
   - If email exists: Links OAuth account to existing user
   - If email doesn't exist: Creates new user and links OAuth account
4. Returns user profile information

### Function: `auth.oauth_login`
Lower-level function that returns a table result (used by `api.oauth_login`).

**Signature:**
```sql
auth.oauth_login(
  p_provider varchar(50),
  p_provider_user_id varchar(255),
  p_email text,
  p_name varchar(255)
) RETURNS TABLE(
  id integer,
  role varchar,
  category varchar
)
```

### Function: `auth.get_oauth_accounts`
Utility function to retrieve all OAuth accounts for a user.

**Signature:**
```sql
auth.get_oauth_accounts(p_user_id integer)
RETURNS TABLE(
  provider varchar,
  provider_user_id varchar,
  provider_email varchar,
  created_at timestamp with time zone
)
```

**Usage:** Get user's linked OAuth accounts

### Function: `auth.unlink_oauth_account`
Utility function to unlink an OAuth provider from a user account.

**Signature:**
```sql
auth.unlink_oauth_account(
  p_user_id integer,
  p_provider varchar(50)
) RETURNS boolean
```

**Usage:** Remove OAuth provider link from user account

## OAuth Flow

### 1. Frontend Initiates OAuth (`/login/oauth/:provider`)
- Generates OAuth state and PKCE code verifier/challenge
- Redirects to provider's authorization URL

### 2. Provider Redirects Back (`/oauth/callback/:provider`)
- Frontend receives authorization code
- Exchanges code for access token using PKCE
- Fetches user profile from provider's API
- Calls backend: `POST /rpc/oauth_login`

### 3. Backend Process (`api.oauth_login`)
- Frontend sends:
  ```json
  {
    "provider": "github",
    "provider_user_id": "12345",
    "email": "user@example.com",
    "name": "John Doe"
  }
  ```
- Backend:
  1. Checks if OAuth account exists
  2. Creates/links user as needed
  3. Returns user profile
- Frontend receives:
  ```json
  {
    "id": 123,
    "role": "user",
    "category": "default"
  }
  ```
- Frontend creates JWT token with user info
- User is authenticated and redirected to home

## Security Features

### 1. PKCE (Proof Key for Code Exchange)
- Prevents authorization code interception attacks
- Code verifier stored in session
- Code challenge sent to provider
- Verifier exchanged during token validation

### 2. State Parameter
- Random state generated per OAuth flow
- Validated on callback to prevent CSRF
- Stored in session cookie

### 3. Session Management
- HTTP-only cookies
- Secure flag in production
- SameSite protection
- Short-lived JWT tokens (15 minutes)

### 4. Database Constraints
- Foreign key to `auth.users`
- Unique constraint on (provider, provider_user_id)
- Cascade delete on user deletion

## Environment Variables

Required for OAuth providers:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# OAuth Configuration
OAUTH_REDIRECT_URL_BASE=https://your-app.com

# Backend API
API_URL=http://localhost:2000
```

## Installation Steps

### 1. Apply Database Schema
```bash
# Run the OAuth schema file
psql -U postgres -d mydb -f /path/to/005_001_oauth_tables.sql
```

### 2. Configure OAuth Providers

#### GitHub:
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   ```
   {OAUTH_REDIRECT_URL_BASE}/oauth/callback/github
   ```
4. Copy Client ID and Client Secret

#### Discord:
1. Go to Discord Developer Portal → Applications
2. Create new application
3. Go to OAuth2 → General
4. Add redirect URL:
   ```
   {OAUTH_REDIRECT_URL_BASE}/oauth/callback/discord
   ```
5. Copy Client ID and Client Secret

### 3. Update Frontend Environment
Update `.env.local` with OAuth credentials:
```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
OAUTH_REDIRECT_URL_BASE=https://your-app.com
API_URL=http://localhost:2000
```

### 4. Restart Services
```bash
# Restart PostgREST
sudo systemctl restart postgrest

# Or if running manually
postgrest /path/to/postgrest.conf
```

## Testing the OAuth Flow

### 1. Test GitHub OAuth
1. Navigate to `/login/github`
2. Complete GitHub authorization
3. Should be redirected to home page with user authenticated

### 2. Test Discord OAuth
1. Navigate to `/login/discord`
2. Complete Discord authorization
3. Should be redirected to home page with user authenticated

### 3. Verify Database Records
```sql
-- Check OAuth accounts
SELECT * FROM auth.oauth_accounts;

-- Check users created
SELECT * FROM auth.users;

-- Check linked accounts for a user
SELECT * FROM auth.get_oauth_accounts(123);
```

## Troubleshooting

### Issue: "Cannot create account without email address"
**Cause:** OAuth provider didn't provide email
**Solution:**
1. Check OAuth scopes in frontend code
2. For GitHub: Ensure `user:email` scope is requested
3. For Discord: Ensure `email` scope is requested

### Issue: OAuth account not linking to existing user
**Cause:** Email mismatch
**Solution:**
1. Check email returned from provider matches `auth.users` email
2. Email comparison is case-sensitive
3. Some providers may return `null` email (GitHub users can hide email)

### Issue: PostgRPC function not found
**Cause:** Function not in exposed schema
**Solution:**
1. Ensure function is in `api` schema (or schema is in `db-schemas` config)
2. Grant execute permission: `GRANT EXECUTE ON FUNCTION api.oauth_login TO anonymous;`
3. Restart PostgREST

## Customization

### Default User Role
In `api.oauth_login`, new users are assigned:
- Role: `'user'` (change to 'admin', 'employee', etc. as needed)
- Category: `'default'` (change to appropriate category)

To customize, modify the INSERT statement in `api.oauth_login`:
```sql
INSERT INTO auth.users (
  email,
  pass,
  role,           -- Change default role here
  category        -- Change default category here
) VALUES (
  p_email,
  encode(gen_random_bytes(32), 'hex'),
  'user',         -- Your default role
  'default'       -- Your default category
);
```

### Employee/Customer Auto-Creation
The `oauth_login` function updates the `employees` table if a user exists there. You may want to add similar logic for other user types.

## API Reference

### Endpoint: POST /rpc/oauth_login

**Request:**
```json
{
  "provider": "github",
  "provider_user_id": "123456789",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response (200 OK):**
```json
{
  "id": 123,
  "role": "user",
  "category": "default"
}
```

**Response (400 Bad Request):**
```json
{
  "code": "invalid_request",
  "message": "Cannot create account without email address"
}
```

**Response (500 Internal Server Error):**
```json
{
  "code": "internal_error",
  "message": "Error details"
}
```
