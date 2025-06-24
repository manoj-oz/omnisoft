const express = require('express');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const pool = require('../db');
const path = require('path');

dotenv.config();
const router = express.Router();

// === Super Admin Login ===
router.post('/superadmin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM super_admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.superadmin = true;
    req.session.superadminId = admin.id;

    res.status(200).json({
      message: 'Super Admin logged in successfully',
      redirectTo: '/superAdmin-dashboard.html' // ✅ matches your filename
    });

  } catch (err) {
    console.error('Superadmin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === Serve Super Admin Pages with Protection ===
router.get('/superAdmin-dashboard.html', (req, res) => {
  if (!req.session.superadmin) {
    return res.redirect('/superAdminLogin.html'); // ✅ matches your filename
  }
  res.sendFile(path.join(__dirname, '../public/superAdmin-dashboard.html')); // ✅ matches filename
});

router.get('/add-admin.html', (req, res) => {
  if (!req.session.superadmin) {
    return res.redirect('/superAdminLogin.html'); // ✅ matches filename
  }
  res.sendFile(path.join(__dirname, '../public/add-admin.html'));
});

// === Add New Admin ===
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
    `;
    await pool.query(insertQuery, [name, email, hashedPassword]);
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// === Logout ===
router.get('/superadmin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }

    res.clearCookie('connect.sid');
    res.redirect('/superAdminLogin.html'); // ✅ matches filename
  });
});

module.exports = router;
