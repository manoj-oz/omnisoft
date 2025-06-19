const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const pool = require('../db');

const router = express.Router();

// ========= Dashboard Data =========
router.get('/dashboard-data', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Not logged in' });

    const result = await pool.query(
      `SELECT e.fullname, e.dob FROM employees e JOIN users u ON e.user_id = u.id WHERE e.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });

    const { fullname, dob } = result.rows[0];
    const today = new Date();
    const dobDate = new Date(dob);
    const isBirthday = dobDate.getDate() === today.getDate() && dobDate.getMonth() === today.getMonth();

    res.json({
      name: fullname,
      birthdayToday: isBirthday ? `🎉 Happy Birthday ${fullname}!` : 'No birthdays today'
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ========= Change Password =========
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.status(401).send('Unauthorized');

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).send('User not found');

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) return res.status(401).send('Incorrect current password');

    const hashedNew = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users SET password = $1, is_first_login = false, default_password = false WHERE id = $2`,
      [hashedNew, userId]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).send('Server error');
  }
});

// ========= Get Profile =========
router.get('/profile', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send('Unauthorized');

  try {
    const result = await pool.query(
      `SELECT fullname, email, department, designation, phone, address FROM employees WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return res.status(404).send('Profile not found');

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).send('Server error');
  }
});

// ========= Update Profile =========
router.put('/profile', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send('Unauthorized');

  const { fullname, phone, department, designation, address } = req.body;

  try {
    await pool.query(
      `UPDATE employees SET fullname = $1, phone = $2, department = $3, designation = $4, address = $5 WHERE user_id = $6`,
      [fullname, phone, department, designation, address, userId]
    );

    await pool.query(`UPDATE users SET fullname = $1 WHERE id = $2`, [fullname, userId]);

    res.sendStatus(200);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send('Server error');
  }
});

// ========= Submit Leave Request =========
router.post('/leave-request', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send('Unauthorized');

  const { leave_type, from_date, to_date, reason } = req.body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (new Date(from_date) < today) {
    return res.status(400).send('From date must be today or a future date');
  }

  try {
    const employee = await pool.query('SELECT employee_id FROM employees WHERE user_id = $1', [userId]);
    if (employee.rows.length === 0) return res.status(400).send('Employee record not found.');

    const employeeId = employee.rows[0].employee_id;

    await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [employeeId, leave_type, from_date, to_date, reason]
    );

    res.send('Leave request submitted');
  } catch (err) {
    console.error('Leave request error:', err);
    res.status(500).send('Server error');
  }
});

// ========= Get Leave History =========
router.get('/leave-history/:employeeId', async (req, res) => {
  const { employeeId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY applied_on DESC',
      [employeeId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Leave history error:', err);
    res.status(500).send('Server error');
  }
});

// ========= Get Documents =========
router.get('/my-documents', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).send('Unauthorized');

    const empRes = await pool.query(`SELECT employee_id FROM employees WHERE user_id = $1`, [userId]);
    const employee_id = empRes.rows[0]?.employee_id;

    const result = await pool.query(`
      SELECT id, document_type, document_name, upload_month, upload_year, uploaded_at
      FROM admin_uploaded_documents
      WHERE employee_id = $1
      ORDER BY uploaded_at DESC
    `, [employee_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching employee documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ========= Download Document =========
router.get('/download-document/:id/:type', async (req, res) => {
  const { id, type } = req.params;

  const typeMap = {
    payslip: 'payslips',
    form16: 'form16',
    resume: 'resume',
    pf: 'pf_details',
    offerletter: 'offer_letter'
  };

  const columnName = typeMap[type.toLowerCase()];
  if (!columnName) {
    return res.status(400).send('Invalid document type');
  }

  try {
    const result = await pool.query('SELECT * FROM employee_documents WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Document not found');
    }

    const fileName = result.rows[0][columnName];
    if (!fileName) {
      return res.status(404).send(`No document found for type: ${type}`);
    }

    const filePath = path.join(__dirname, '..', 'uploads', fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found on server');
    }

    res.download(filePath);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
