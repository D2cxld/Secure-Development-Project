const nodemailer = require('nodemailer');
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

  console.log("✅ Email Configuration:");
  console.log("✅ EMAIL_USER:", process.env.EMAIL_USER);
  console.log("✅ EMAIL_PASS length:", process.env.EMAIL_PASS?.length || 'not set');

  // Mock mode flag - set to true to mock emails, false to attempt real sending
  const MOCK_MODE = true;

  // Create transporter only if credentials are available and not in mock mode
  let transporter = null;
  if (!MOCK_MODE && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
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

    // Test the connection when the server starts
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP verification failed:", error);
      } else {
        console.log("✅ SMTP server is ready to take messages");
      }
    });
  } else {
    console.log("⚠️ Email service running in mock mode - no real emails will be sent.");
  }

  /**
   * Send a verification code email for 2FA
   * @param {string} email - The recipient's email address
   * @param {string|number} code - The 6-digit verification code
   * @returns {Promise} - The result of the email sending operation
   */
  async function sendVerificationCode(email, code) {
    // In mock mode or if transporter isn't set up, use mock version
    if (MOCK_MODE || !transporter) {
      console.log('! MOCK EMAIL SERVICE - Development Mode !');
      console.log(`! Would send verification code ${code} to ${email}`);
      console.log('! Code for testing: ', code);

      // Return success without attempting SMTP connection
      return { success: true, message: 'Email mocked for development' };
    }

    // Real email sending logic when mock mode is disabled
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Secure Health Blog - Verification Code',
        text: `Your verification code is: ${code}

  This code will expire in 10 minutes.

  If you did not request this code, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a4a4a;">Your Verification Code</h2>
            <p style="font-size: 16px;">Use the following code to complete your verification:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
              ${code}
            </div>
            <p style="color: #777; margin-top: 20px; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #777; font-size: 14px;">If you did not request this code, please ignore this email.</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  module.exports = sendVerificationCode;