// === routes/adminRoutes.js ===
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('../db');
const sendOnboardingEmail = require('../utils/email');

const router = express.Router();

// === Password generator ===
function generatePassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// === Multer Setup ===
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({ storage });

// === POST /onboard - Add New Employee ===
router.post('/onboard', upload.fields([
  { name: 'resume' },
  { name: 'pf' },
  { name: 'offerLetter' },
  { name: 'form16' },
  { name: 'payslips' }
]), async (req, res) => {
  try {
    const {
      fullname, phone, gender, dob, designation, department,
      experience, prevOrg, startDate, address, emergency, notes, personalEmail
    } = req.body;

    const emailPrefix = fullname.toLowerCase().replace(/\s+/g, '');
    const timestamp = Date.now().toString().slice(-5);
    const email = `${emailPrefix}${timestamp}@omnisoftsystems.com`;
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const userInsert = await pool.query(
      `INSERT INTO users (fullname, email, password, role, is_first_login, default_password)
       VALUES ($1, $2, $3, 'employee', true, true)
       RETURNING id`,
      [fullname, email, hashedPassword]
    );

    const userId = userInsert.rows[0].id;

    const resume = req.files?.resume?.[0]?.filename || null;
    const pf = req.files?.pf?.[0]?.filename || null;
    const offerLetter = req.files?.offerLetter?.[0]?.filename || null;
    const form16 = req.files?.form16?.[0]?.filename || null;
    const payslips = req.files?.payslips?.[0]?.filename || null;

    await pool.query(`
      INSERT INTO employee_onboarding (
        user_id, fullname, email, phone, gender, dob, designation, department,
        experience, prev_org, start_date, address, emergency_contact,
        resume, pf_details, offer_letter, form16, payslips, notes, personal_email
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20
      )
    `, [
      userId, fullname, email, phone, gender, dob, designation, department,
      experience || null, prevOrg || null, startDate, address, emergency,
      resume, pf, offerLetter, form16, payslips, notes || null, personalEmail || null
    ]);

    if (personalEmail) {
      await sendOnboardingEmail(personalEmail, {
        officialEmail: email,
        tempPassword: plainPassword
      });
    }

    res.send(`
      <h2>✅ Employee Onboarded Successfully</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${plainPassword}</p>
      <p><a href="/employee-onboarding.html">← Back to Onboarding Form</a></p>
    `);
  } catch (err) {
    console.error('❌ Onboarding error:', err);
    res.status(500).send('❌ Failed to onboard employee. Please check your inputs and try again.');
  }
});

// === GET /employees - List All Employees ===
router.get('/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employee_onboarding ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching employees:', err);
    res.status(500).send('❌ Failed to fetch employees.');
  }
});

module.exports = router;
