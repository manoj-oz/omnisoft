const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

// ========= Dashboard Data =========
router.get('/dashboard-data', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Not logged in' });

    // Fetch name and dob from employee_onboarding
    const result = await pool.query(
      `SELECT fullname, dob FROM employee_onboarding WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { fullname, dob } = result.rows[0];

    // Check if today is the employee's birthday
    const today = new Date();
    const dobDate = new Date(dob);
    const isBirthday =
      dobDate.getDate() === today.getDate() && dobDate.getMonth() === today.getMonth();

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

    if (result.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).send('Incorrect current password');

    const hashedNew = await bcrypt.hash(newPassword, 10);

    await pool.query(`
      UPDATE users
      SET password = $1, is_first_login = false, default_password = false
      WHERE id = $2
    `, [hashedNew, userId]);

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
    const result = await pool.query(`
      SELECT fullname, email, department, designation, phone, address
      FROM employee_onboarding
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Profile not found');
    }

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
    await pool.query(`
      UPDATE employee_onboarding
      SET fullname = $1, phone = $2, department = $3, designation = $4, address = $5
      WHERE user_id = $6
    `, [fullname, phone, department, designation, address, userId]);

    await pool.query(`UPDATE users SET fullname = $1 WHERE id = $2`, [fullname, userId]);

    res.sendStatus(200);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
