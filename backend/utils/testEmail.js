require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // ✅ Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


transporter.sendMail({
  from: `"Wellbeing Blog Test" <${process.env.EMAIL_USER}>`,
  to: 'DDS_test_user1@outlook.com',
  subject: 'SMTP Debug Test',
  text: 'This is a test email from testEmail.js'
}, (err, info) => {
  if (err) return console.error('❌ TEST EMAIL FAILED:', err);
  console.log('✅ TEST EMAIL SENT:', info.response);
});
