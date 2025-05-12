# Secure Wellbeing Blog

A secure, privacy-focused platform with role-based access (users, admins, super-admins).

## Features

- Secure user authentication with role-based access control
- Two-factor authentication (2FA) for admin users
- Email verification for account security
- PostgreSQL database for secure data storage
- NIST-style password validation
- Protection against common security vulnerabilities

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Security**: bcrypt for password hashing with pepper, email-based 2FA
- **Email**: Nodemailer with Gmail SMTP

## Setup Instructions

### Prerequisites

- Node.js (v20+)
- PostgreSQL (v13+)
- Gmail account for sending emails (with App Password if 2FA is enabled)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/22kongi/DSS-SDP-Chris.git
   cd DSS-SDP-Chris
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file in the `/backend` directory based on the following template:
   ```
   PEPPER=your_secret_pepper_string
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_gmail_app_password

   # PostgreSQL Configuration
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=secureblog_roles_v2
   DB_PORT=5432
   ```

4. Set up PostgreSQL database and email delivery
   ```
   npm run setup
   ```
   This interactive script will:
   - Create the PostgreSQL database
   - Run migrations to create tables
   - Add an initial admin to the whitelist
   - Test email delivery

### Running the Application

1. Start the server
   ```
   npm start
   ```
   Or for development with automatic restart:
   ```
   npm run dev
   ```

2. Access the application at http://localhost:5500

## Authentication Flow

1. **Regular Users**:
   - Register with email, username, and password
   - Login with username and password

2. **Admin Users**:
   - Email must be whitelisted before registration
   - 2FA required during registration
   - Email verification code sent for 2FA
   - Account only created after successful 2FA verification

## Database Schema

- **user_login**: Authentication data (username, email, hashed_pw, role, uses_2fa)
- **user_profile**: User information (username, first/last name, created_at)
- **admin_whitelist**: Pre-approved admin emails (email, approved_by)
- **temp_admin_registration**: Temporary storage for admin registrations during 2FA verification

## Security Features

- PEPPERED password hashing (bcrypt + .env secret)
- Common password blacklist enforcement
- Email + username availability checks
- Regex-based email validation
- Role-based redirect logic
- Admin-only access to sensitive areas
- Two-Factor Authentication (2FA) for admins
- Temporary data storage until 2FA verification is complete

## License

ISC
