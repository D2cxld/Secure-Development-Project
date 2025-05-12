require('dotenv').config({ path: __dirname + '/../.env' });

console.log("📧 Email Configuration Test");
console.log("✅ EMAIL_USER:", process.env.EMAIL_USER);
console.log("✅ EMAIL_PASS length:", process.env.EMAIL_PASS?.length || 'not set');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // For development only
  }
});

// Test the SMTP connection first
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP verification failed:", error);
    console.log("💡 Troubleshooting tips:");
    console.log("1. Check if EMAIL_USER and EMAIL_PASS are correctly set in .env");
    console.log("2. Ensure you're using an app password for Gmail");
    console.log("3. Make sure 2-step verification is enabled on your Gmail account");
    console.log("4. Verify network connectivity to smtp.gmail.com:465");
  } else {
    console.log("✅ SMTP server is ready to take messages");

    // Now try to send an actual test email
    console.log("📤 Sending test email...");

    transporter.sendMail({
      from: `"Wellbeing Blog Test" <${process.env.EMAIL_USER}>`,
      to: 'DDS_test_user1@outlook.com', // You can change this to your email for testing
      subject: 'SMTP Debug Test',
      text: 'This is a test email from the updated testEmail.js script',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email to verify that the SMTP configuration is working correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `
    }, (err, info) => {
      if (err) {
        console.error('❌ TEST EMAIL FAILED:', err);
        console.log("💡 Check for specific error messages above to diagnose the issue.");
      } else {
        console.log('✅ TEST EMAIL SENT:', info.response);
        console.log('✅ Email service is properly configured!');
      }

      // Exit after sending the test email
      process.exit(0);
    });
  }
});
