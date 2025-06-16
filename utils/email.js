const nodemailer = require('nodemailer');
require('dotenv').config(); // to load EMAIL_USER and EMAIL_PASS from .env


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOnboardingEmail = async (to, { officialEmail, tempPassword }) => {
  try {
    await transporter.sendMail({
      from: `"Omnisoft HR" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Welcome to Omnisoft Systems - Your Login Credentials',
      html: `
        <h3>Welcome to Omnisoft Systems</h3>
        <p>You've been successfully onboarded. Here are your login details:</p>
        <ul>
          <li><strong>Official Email:</strong> ${officialEmail}</li>
          <li><strong>Temporary Password:</strong> ${tempPassword}</li>
        </ul>
        <p>Please log in at <a href="http://localhost:3000">HR Portal</a> and change your password.</p>
        <br>
        <p>Thanks,<br>HR Team</p>
      `
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error(`❌ Error sending email to ${to}:`, err);
  }
};

module.exports = sendOnboardingEmail;
