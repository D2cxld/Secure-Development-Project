# Secure-Development-Project
The aim of this assignment is for our group to code a secure and usable web-based blog system that mitigates, at a minimum, the five most common security vulnerabilities of account enumeration, session hijacking, SQL injection, cross-site scripting and cross- site request forgery

Project Structure

Frontend Files

homepage.html: Main landing page with navigation
blogpage.html: Blog feed showing trending and all posts
post.html: Form for creating new blog posts
usercontrol.html: User dashboard to manage their posts
itslogin.html: User login page
admin.html: admin dashboard to manage all posts 


Backend Files

post.js: Handles blog post CRUD operations
login.js: User login logic
postroutes.js: Express routes for post operations
db.js: handles the Postgresql connnection 

server.js 
PostgreSQL Connection:
Handled the postgresql connection

Middleware:
 It uses middleware to handle JSON and URL-encoded requests, manage user sessions, and log incoming requests.
 
 Static assets like CSS and JavaScript files are served from specific directories. The server imports and mounts route handlers for user registration, login, blog posts, and session management.

 Static file serving: 

Routes
Several routes serve HTML pages for different parts of the application, including the blog, admin panel, user control center, login, registration, and more. A catch-all route returns a 404 error for undefined


Key Features

User Features

Authentication System: Secure login/logout with session management
Blog Post Creation: Users can create posts with titles and content
Post Management: Users can view and delete their own posts
Search Functionality: Full-text search across all blog posts
Technical Features

Database Integration: MySQL for user data, PostgreSQL for blog posts
Session Management: Tracks logged-in users
Security: Input sanitization, password protection
Responsive Design: Works on mobile and desktop

Setup Instructions:

Prerequisites

Node.js
MySQL database
PostgreSQL database
Installation

Clone the repository
Install dependencies: npm install express mysql2 pg express-session
Set up database connections in auth.js and post.js
Run the application: node your_main_server_file.js
API Endpoints

Posts

GET /posts - Get all posts (supports search query parameter)
POST /posts - Create a new post
DELETE /posts/:id - Delete a post
Authentication

POST /login - User login
POST /register - User registration
POST /reset-password - Password reset
Security Considerations

All user input is sanitized before database insertion
Passwords are not stored in plaintext
Session management prevents unauthorized access
CSRF protection should be implemented for production

Future Enhancements:
Implement post editing
Add user profiles
Include image upload for posts
Implement proper password hashing


If posts aren't loading, check database connection strings
Session issues may require clearing browser cookies
Ensure all database tables are properly created