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
 * Send a verification code email for 2FA
 * @param {string} email - The recipient's email address
 * @param {string|number} code - The 6-digit verification code
 * @returns {Promise} - The result of the email sending operation
 */
function sendVerificationCode(email, code) {
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: `"Wellbeing Blog" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your 2FA Verification Code',
      text: `Your 2FA code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p>Use the following code to complete your registration or login:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0; border-radius: 4px;">
            ${code}
          </div>
          <p style="color: #777; font-size: 14px;">This code will expire in 10 minutes for security purposes.</p>
          <p style="color: #777; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    }, (error, info) => {
      if (error) {
        console.error('❌ Failed to send email:', error);
        reject(error);
      } else {
        console.log('✅ Email sent successfully:', info.response);
        resolve(info);
      }
    });
  });
}

module.exports = sendVerificationCode;
