Secure Wellbeing Blog

  A secure, privacy-focused platform with role-based access (users, admins, super-admins).

  Features

  - Secure user authentication with role-based access control
  - Two-factor authentication (2FA) for admin users
  - Email verification for account security
  - PostgreSQL database for secure data storage
  - NIST-style password validation
  - Protection against common security vulnerabilities

  Technology Stack

  - Backend: Node.js, Express
  - Database: PostgreSQL
  - Security: bcrypt for password hashing with pepper, email-based 2FA
  - Email: Nodemailer with Gmail SMTP
  - Development: Dev Container/Docker for consistent environments

  Setup Instructions

  Prerequisites

  - Node.js (v20+)
  - PostgreSQL (v13+)
  - Docker Desktop (for containerized development environment)
  - Gmail account for sending emails (with App Password if 2FA is enabled)

  Dev Container Setup (Recommended)

  This project uses Dev Containers (formerly Remote Containers) to ensure consistent development environments across systems (Windows, macOS,
  Linux, WSL).

  1. Install VS Code and the Dev Containers extension
  2. Install Docker Desktop
  3. Clone the repository
  git clone https://github.com/22kongi/DSS-SDP-Chris.git
  4. Open the project in VS Code
  5. When prompted, click "Reopen in Container" or use Command Palette (F1) → "Dev Containers: Reopen in Container"
  6. The container will set up the entire development environment, including:
    - Node.js
    - PostgreSQL database on port 5433
    - All dependencies

  Manual Installation

  If not using Dev Containers:

  1. Clone the repository
  git clone https://github.com/22kongi/DSS-SDP-Chris.git
  cd DSS-SDP-Chris
  2. Install dependencies
  npm install
  3. Configure environment variables
    - Create a .env file in the /backend directory based on the following template:
  PEPPER=your_secret_pepper_string
  EMAIL_USER=your_gmail_address@gmail.com
  EMAIL_PASS=your_gmail_app_password

  # PostgreSQL Configuration
  DB_HOST=localhost
  DB_USER=postgres
  DB_PASSWORD=your_postgres_password
  DB_NAME=secureblog_roles_v2
  DB_PORT=5432

  JWT_SECRET=your_secure_random_string_for_jwt
  4. Set up PostgreSQL database and email delivery
  npm run setup
  4. This interactive script will:
    - Create the PostgreSQL database
    - Run migrations to create tables
    - Add an initial admin to the whitelist
    - Test email delivery

  Docker Setup (Alternative)

  For a containerized environment without VS Code Dev Containers:

  1. Install Docker Desktop
  2. Build and start the containers:
  docker-compose up -d
  3. The PostgreSQL database will be available on port 5433
  4. Update your .env file to use the Docker PostgreSQL instance:
  DB_HOST=localhost
  DB_PORT=5433

  Running the Application

  1. Start the server
  npm start
  1. Or for development with automatic restart:
  npm run dev
  2. Access the application at http://localhost:5500

  Testing the Application

  The project includes comprehensive security testing to validate all security controls.

  Core Security Tests

  The most important security tests are located in the root directory:
  npm run test-auth         # Test full authentication flow
  npm run test-csrf         # Test CSRF protection
  npm run test-login        # Test login security
  npm run test-registration # Test NIST password requirements

  For detailed test analysis and methodology, see CORE_TEST_ANALYSIS/TESTING.md, which explains how each test validates specific security
  controls.

  Test Organization

  Tests are organized into logical categories:
  - Root Directory: Essential security tests that demonstrate core functionality
  - tests/db-tests/: Database connection and security tests
  - tests/security-variants/: Alternative security testing approaches
  - tests/helpers/: Administrative utilities for testing
  - tests/development/: Development versions of server components

  Running Tests

  # Run all Jest tests
  npm test

  # Run specific tests
  npm run test:unit         # Unit tests
  npm run test:coverage     # Test coverage report

  # Database utilities
  npm run db-explore        # Explore database state
  npm run check-db          # Check database connection

  Authentication Flow

  1. Regular Users:
    - Register with email, username, and password
    - Login with username and password
  2. Admin Users:
    - Email must be whitelisted before registration
    - 2FA required during registration
    - Email verification code sent for 2FA
    - Account only created after successful 2FA verification

  Database Schema

  - user_login: Authentication data (username, email, hashed_pw, role, uses_2fa)
  - user_profile: User information (username, first/last name, created_at)
  - admin_whitelist: Pre-approved admin emails (email, approved_by)
  - temp_admin_registration: Temporary storage for admin registrations during 2FA verification

  Security Features

  - PEPPERED password hashing (bcrypt + .env secret)
  - Common password blacklist enforcement
  - Email + username availability checks
  - Regex-based email validation
  - Role-based redirect logic
  - Admin-only access to sensitive areas
  - Two-Factor Authentication (2FA) for admins
  - Temporary data storage until 2FA verification is complete
  - CSRF protection using double-submit cookie pattern
  - Secure HTTP headers with Helmet
  - Parameterized SQL queries to prevent injection
  - Session management with secure cookies

  Project Structure

  /
  ├── backend/              # Server-side code
  │   ├── routes/           # Express routes
  │   ├── middleware/       # Auth middleware
  │   └── utils/            # Utility functions
  ├── Front-end/            # Client-side code
  ├── tests/                # Organized test files
  │   ├── db-tests/         # Database tests
  │   ├── security-variants/# Security test variants
  │   ├── helpers/          # Test helper utilities
  │   └── development/      # Development scripts
  ├── CORE_TEST_ANALYSIS/   # Test documentation
  └── db/                   # Database migrations

  Troubleshooting

  If you encounter Docker or PostgreSQL connection issues:

  1. Check Docker containers are running:
  docker ps
  2. Verify PostgreSQL port mapping:
  docker-compose ps
  3. Try connecting directly to the PostgreSQL container:
  docker exec -it postgres-container psql -U postgres
  4. If using WSL2, ensure Docker Desktop WSL integration is enabled