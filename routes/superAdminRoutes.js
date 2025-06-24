const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const pool = require('../db');
const path = require('path');

dotenv.config();
const router = express.Router();

// === Super Admin Login ===
router.post('/superadmin/login', (req, res) => {
  const { email, password } = req.body;

  const inputEmail = email.trim().toLowerCase(); // normalize input
  const inputPassword = password.trim();

  const superEmail = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const superPass = process.env.SUPER_ADMIN_PASSWORD.trim();

  console.log("Received Email:", inputEmail);
  console.log("Env Email:", superEmail);

  if (inputEmail === superEmail && inputPassword === superPass) {
    req.session.superadmin = true;
    return res.status(200).json({ message: 'Super Admin logged in successfully' });
  } else {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
});


// === Serve Super Admin Pages with Protection ===
router.get('/superadmin-dashboard.html', (req, res) => {
  if (!req.session.superadmin) {
    return res.redirect('/superadmin-login.html');
  }
  res.sendFile(path.join(__dirname, '../public/superadmin-dashboard.html'));
});

router.get('/add-admin.html', (req, res) => {
  if (!req.session.superadmin) {
    return res.redirect('/superadmin-login.html');
  }
  res.sendFile(path.join(__dirname, '../public/add-admin.html'));
});

// === Add New Admin (only if logged in as Super Admin) ===
router.post('/superadmin/add-admin', async (req, res) => {
  if (!req.session.superadmin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkQuery = 'SELECT * FROM admins WHERE email = $1';
    const result = await pool.query(checkQuery, [email]);

    if (result.rows.length > 0) {
      return res.status(409).json({ error: 'Admin already exists' });
    }

    const insertQuery = `
      INSERT INTO admins (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    await pool.query(insertQuery, [name, email, hashedPassword]);
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
