const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with SSL enabled
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // For development only, set to true in production
  }
});

console.log("✅ Email Configuration:");
console.log("✅ EMAIL_USER:", process.env.EMAIL_USER);
console.log("✅ EMAIL_PASS length:", process.env.EMAIL_PASS?.length || 'not set');

// Test the connection when the server starts
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP verification failed:", error);
  } else {
    console.log("✅ SMTP server is ready to take messages");
  }
});

/**
 * Send a verification code email for 2FA (MOCK VERSION FOR TESTING)
 * @param {string} email - The recipient's email address
 * @param {string|number} code - The 6-digit verification code
 * @returns {Promise} - The result of the email sending operation
 */
function sendVerificationCode(email, code) {
  return new Promise((resolve) => {
    console.log('======================================');
    console.log('📧 MOCK EMAIL SENT');
    console.log(`📧 To: ${email}`);
    console.log(`📧 Verification Code: ${code}`);
    console.log('======================================');

    // Always resolve successfully
    resolve({ response: 'Mock email sent successfully' });
  });
}

module.exports = sendVerificationCode;
