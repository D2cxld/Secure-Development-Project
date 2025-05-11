const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendVerificationCode(email, code) {
  return transporter.sendMail({
    from: `"Wellbeing Blog" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your 2FA Verification Code',
    text: `Your 2FA code is: ${code}`
  });
}

module.exports = sendVerificationCode;
