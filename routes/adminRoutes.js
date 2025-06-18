// === routes/adminRoutes.js ===
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const pool = require('../db');
const sendOnboardingEmail = require('../utils/email');
const nodemailer = require('nodemailer');

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
      experience, prevOrg, startDate, address, emergency, personalEmail
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
        resume, pf_details, offer_letter, form16, payslips, personal_email
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19
      )
    `, [
      userId, fullname, email, phone, gender, dob, designation, department,
      experience || null, prevOrg || null, startDate, address, emergency,
      resume, pf, offerLetter, form16, payslips || null, personalEmail || null
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

// === GET /admin/pending-leaves ===
router.get('/pending-leaves', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT lr.*, eo.fullname FROM leave_requests lr 
      JOIN employee_onboarding eo ON lr.employee_id = eo.id 
      WHERE status = 'Pending' 
      ORDER BY applied_on DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching leave requests:', err);
    res.status(500).send('❌ Failed to fetch leave requests.');
  }
});


// === POST /admin/update-leave-status ===
router.post('/update-leave-status', async (req, res) => {
  const { request_id, status } = req.body;
  try {
    const leaveRes = await pool.query(
      `UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING employee_id, leave_type, from_date, to_date`,
      [status, request_id]
    );

    const leave = leaveRes.rows[0];

    if (status === 'Approved') {
      const leaveDays =
        (new Date(leave.to_date) - new Date(leave.from_date)) / (1000 * 60 * 60 * 24) + 1;
      const column = leave.leave_type.toLowerCase() + '_leave';
      await pool.query(
        `UPDATE leave_balances SET ${column} = ${column} - $1 WHERE employee_id = $2`,
        [leaveDays, leave.employee_id]
      );
    }

    const emailRes = await pool.query(`SELECT email FROM users WHERE id = $1`, [leave.employee_id]);
    sendNotification(emailRes.rows[0].email, status);

    res.send('Leave status updated');
  } catch (err) {
    console.error('❌ Failed to update leave status:', err);
    res.status(500).send('❌ Failed to update leave status');
  }
});

// === GET /admin/leave-balances ===
router.get('/leave-balances', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.fullname, lb.* FROM leave_balances lb
      JOIN users u ON lb.employee_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Failed to fetch leave balances:', err);
    res.status(500).send('❌ Failed to fetch leave balances');
  }
});
// ==== Send notifications =========
function sendNotification(email, status, name = '') {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your_email@gmail.com',       // replace with your mail
      pass: 'your_app_password'           // replace with app password
    }
  });

  const mailOptions = {
    from: 'your_email@gmail.com',
    to: email,
    subject: `Leave ${status}`,
    text: `Hi ${name || 'Employee'},\n\nYour leave request has been ${status.toLowerCase()}.\n\nRegards,\nHR Team`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error('Email send error:', err);
    else console.log('Email sent:', info.response);
  });
}

// Get all leave requests
router.get('/leave-requests', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lr.id,
        eo.fullname,
        lr.leave_type,
        lr.from_date,
        lr.to_date,
        lr.reason,
        lr.status,
        lr.applied_on
      FROM leave_requests lr
      JOIN employee_onboarding eo ON lr.employee_id = eo.user_id
      ORDER BY lr.applied_on DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).send('Server error');
  }
});


router.post('/leave-requests/:id/action', async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!['Approved', 'Rejected'].includes(action)) {
    return res.status(400).send('Invalid action');
  }

  try {
    const leave = await pool.query(`
      UPDATE leave_requests
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [action, id]);

    if (leave.rows.length === 0) {
      return res.status(404).send('Leave not found');
    }

    const empInfo = await pool.query(`
      SELECT eo.email, eo.fullname
      FROM employee_onboarding eo
      JOIN leave_requests lr ON eo.user_id = lr.employee_id
      WHERE lr.id = $1
    `, [id]);

    const { email, fullname } = empInfo.rows[0];

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your_email@gmail.com', // change this
        pass: 'your_app_password',    // use App Password
      },
    });

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: email,
      subject: `Leave ${action}`,
      text: `Hi ${fullname},\n\nYour leave request has been ${action.toLowerCase()}.\n\nRegards,\nHR Team`,
    };

    await transporter.sendMail(mailOptions);

    res.send('Leave updated and email sent');
  } catch (err) {
    console.error('Leave action error:', err);
    res.status(500).send('Server error');
  }
});

// === GET /admin/stats - Total Employees ===
router.get('/stats', async (req, res) => {
  try {
    const empRes = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['employee']);
    res.json({ totalEmployees: parseInt(empRes.rows[0].count) });
  } catch (err) {
    console.error('❌ Failed to fetch stats:', err);
    res.status(500).send('Failed to fetch stats');
  }
});


// === PUT /admin/leaves/:id/status ===
router.put('/leaves/:id/status', async (req, res) => {
  const leaveId = req.params.id;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE leave_requests SET status = $1 WHERE id = $2 RETURNING employee_id, leave_type, from_date, to_date`,
      [status, leaveId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    const leave = result.rows[0];

    // Update leave balances if approved
    if (status === 'Approved') {
      const days =
        (new Date(leave.to_date) - new Date(leave.from_date)) / (1000 * 60 * 60 * 24) + 1;
      const column = leave.leave_type.toLowerCase() + '_leave';

      await pool.query(
        `UPDATE leave_balances SET ${column} = ${column} - $1 WHERE employee_id = $2`,
        [days, leave.employee_id]
      );
    }

    // Fetch employee email
    const emp = await pool.query(`
      SELECT eo.email, eo.fullname FROM employee_onboarding eo
      WHERE eo.user_id = $1
    `, [leave.employee_id]);

    if (emp.rows.length > 0) {
      const { email, fullname } = emp.rows[0];

      // Send notification email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'your_email@gmail.com',  // replace
          pass: 'your_app_password'      // replace
        }
      });

      const mailOptions = {
        from: 'your_email@gmail.com',
        to: email,
        subject: `Leave ${status}`,
        text: `Hi ${fullname},\n\nYour leave request from ${leave.from_date} to ${leave.to_date} for ${leave.leave_type} has been ${status.toLowerCase()}.\n\nRegards,\nHR Team`
      };

      await transporter.sendMail(mailOptions);
    }

    res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully.` });
  } catch (err) {
    console.error('❌ Error updating leave status:', err);
    res.status(500).json({ success: false, message: 'Error updating leave status' });
  }
});

module.exports = router;
