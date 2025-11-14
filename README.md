# iClass - Maritime Vessel Certification Management System

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![PostgREST](https://img.shields.io/badge/PostgREST-3.0+-red.svg?style=flat)](https://postgrest.org)
[![React Router](https://img.shields.io/badge/React%20Router-7.0+-61dafb.svg?style=flat)](https://reactrouter.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?style=flat)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)

iClass is a modern fullstack web application designed for **maritime vessel certification and management**. It provides a comprehensive system for tracking vessel certifications, inspections, and administrative data with robust authentication including traditional login and OAuth2 (GitHub & Discord).

## 🚀 Features

### Authentication & Security
- **Email/Password Authentication** with bcrypt password hashing
- **OAuth 2.0 Integration** with GitHub and Discord
- **PKCE (Proof Key for Code Exchange)** for enhanced OAuth security
- **JWT Tokens** with 15-minute expiration
- **Session-based authentication** with HTTP-only cookies
- **Role-based access control** (admin, user roles)

### Maritime Management
- Vessel classification and status tracking
- Certificate management with validity periods
- Survey and audit management
- Ship administration types
- Certificate status tracking (Valid, Suspended, Withdrawn)

### Technical Features
- **Multi-schema database architecture**
- **PostgREST API** for automatic RESTful endpoints
- **Server-Side Rendering (SSR)** with React
- **Type-safe development** with TypeScript
- **Responsive design** with Tailwind CSS
- **Form validation** with Zod

## 🛠️ Technology Stack

### Frontend
- **React Router v7** - Modern routing with SSR
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **Zod** - Schema validation
- **jose** - JWT handling

### Backend
- **PostgreSQL** - Relational database
- **PostgREST** - RESTful API layer
- **JWT** - Authentication tokens

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy with SSL
- **Let's Encrypt** - SSL certificates

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 22 or higher
- **Docker** and **Docker Compose**
- **PostgreSQL** (or use Docker)
- **OpenSSL** (for password generation)

## 🔧 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd iclass
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Configure environment variables

Create a `.env.development` file in the `/frontend/` directory:

```env
# API Configuration
API_URL="http://localhost:2000"
SECRET="your-secret-key-here"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Discord OAuth
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# OAuth Configuration
OAUTH_REDIRECT_URL_BASE="http://localhost:5173"
```

### 4. Setup database

#### Option A: Using Docker Compose (Recommended)

```bash
# From project root
docker-compose up -d
```

This will start:
- PostgreSQL database
- PostgREST API server

#### Option B: Manual Setup

```bash
cd backend
postgrest postgrest.conf
```

### 5. Run the development server

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔐 OAuth Setup

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to: `http://localhost:5173/oauth/callback/github`
4. Copy Client ID and Client Secret to your `.env.development`

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Set redirect URL to: `http://localhost:5173/oauth/callback/discord`
4. Copy Client ID and Client Secret to your `.env.development`

## 🚀 Deployment

For production deployment, use the automated deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

The deployment script will:
- Update system packages
- Install Docker & Docker Compose
- Configure swap space
- Provision SSL certificates (Let's Encrypt)
- Setup Nginx reverse proxy
- Deploy Docker containers

**Production URLs:**
- Frontend: `https://your-domain.com`
- API: `https://your-domain.com:2000`

## 📁 Project Structure

```
iclass/
├── backend/                      # Backend services
│   ├── postgrest.conf           # PostgREST configuration
│   ├── schema/                  # Database migrations
│   │   ├── 001_*.sql           # Initial setup
│   │   ├── 002_*.sql           # Authentication & OAuth
│   │   ├── 003_*.sql           # Playground functions
│   │   └── 004_*.sql           # Maritime/certification tables
│   └── README.md
│
├── frontend/                    # Frontend application
│   ├── app/
│   │   ├── .server/            # Server-side code
│   │   │   ├── lib/            # Utilities (api, jwt, sessions, env)
│   │   │   └── oauth/          # OAuth implementations
│   │   │       ├── base.ts     # Base OAuth client
│   │   │       ├── github.ts   # GitHub OAuth
│   │   │       └── discord.ts  # Discord OAuth
│   │   ├── definitions/        # TypeScript types
│   │   ├── lib/                # Client-side utilities
│   │   ├── routes/             # React Router routes
│   │   │   ├── home.tsx        # Dashboard
│   │   │   ├── login.tsx       # Email/password login
│   │   │   ├── logout.tsx      # Logout handler
│   │   │   ├── oauth.tsx       # OAuth initiation
│   │   │   └── oauth_callback.tsx  # OAuth callback
│   │   ├── welcome/            # UI components
│   │   ├── root.tsx            # Root component
│   │   └── routes.ts           # Route configuration
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── docker-compose.yml          # Docker services
├── deploy.sh                   # Deployment script
└── README.md
```

## 🔌 API Reference

### Authentication Endpoints

#### Email/Password Login
```bash
POST /rpc/user_profile
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### OAuth Login
```bash
POST /rpc/oauth_login
Content-Type: application/json

{
  "provider": "github" | "discord",
  "provider_user_id": "string",
  "email": "user@example.com",
  "username": "string",
  "access_token": "string"
}
```

#### Generate JWT Token
```bash
POST /rpc/login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## 🔒 Security Features

### Password Security
- **bcrypt hashing** with automatic salt generation
- **No plain-text storage** of passwords
- **Database triggers** for automatic encryption

### OAuth Security
- **PKCE implementation** for OAuth 2.0
- **State parameter validation** prevents CSRF attacks
- **HTTP-only cookies** prevent XSS attacks
- **Secure flag** in production

### JWT Security
- **15-minute token expiration** limits exposure
- **HS256 algorithm** for signing
- **Environment-based secrets** for security
- **Authorization header** for secure transmission

### Database Security
- **Role-based access control** with granular permissions
- **Schema-level permissions** for data isolation
- **SECURITY DEFINER** for stored functions
- **Anonymous role** for public API access

## 🏗️ Development

### Available Scripts

```bash
# Frontend
npm run dev          # Start development server with HMR
npm run build        # Create production build
npm run start        # Serve production build
npm run typecheck    # Run TypeScript type checking
```

### Database Schema

The application uses a multi-schema architecture:

- **`auth`** - User authentication and OAuth accounts
- **`api`** - Exposed PostgREST functions
- **`iclass`** - Maritime/certification data
- **`public`** - General database objects

### Key Database Functions

- `auth.user_profile` - Validates email/password
- `api.user_profile` - Public user profile endpoint
- `api.login` - Generates JWT tokens
- `api.oauth_login` - Handles OAuth user creation/linking

## 📊 Database Tables Overview

### Authentication Schema
- `users` - Core user accounts
- `oauth_accounts` - Linked OAuth provider accounts

### Maritime Schema
- `administration_types` - Vessel administration categories
- `class_status` - Classification status types
- `ship_status` - Ship operational status
- `certificate_status` - Certificate validity status
- `certificates_validity_type` - Certificate validity types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose up -d db`
- Check connection string in `postgrest.conf`
- Verify database credentials

### OAuth Not Working
- Verify callback URLs match exactly in provider settings
- Check client IDs and secrets in `.env.development`
- Ensure `OAUTH_REDIRECT_URL_BASE` is correct

### Build Errors
- Clear node_modules: `rm -rf frontend/node_modules && npm install`
- Clear build cache: `npm run build -- --force`

## 📚 Additional Resources

- [PostgREST Documentation](https://postgrest.org)
- [React Router Documentation](https://reactrouter.com)
- [PostgreSQL Documentation](https://postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com)

## 🎯 Roadmap

- [ ] Add more OAuth providers (Google, Microsoft)
- [ ] Implement role-based UI
- [ ] Add maritime-specific dashboards
- [ ] Implement rate limiting
- [ ] Add unit and integration tests
- [ ] Generate OpenAPI/Swagger documentation
- [ ] Add monitoring and logging
- [ ] Implement Redis for session management

---

Built with ❤️ for maritime certification management
