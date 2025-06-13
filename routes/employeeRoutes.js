// === routes/employeeRoutes.js ===
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

// ========= Change Password =========
router.post('/change-password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId;

  if (!userId) return res.status(401).send('Unauthorized');

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
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

module.exports = router;
