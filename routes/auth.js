const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// === SIGNUP ===
router.post('/signup', async (req, res) => {
  console.log("Signup request received:", req.body);
  const { fullname, email, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users 
       (fullname, email, password, role, is_first_login, default_password) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fullname, email, hashedPassword, 'employee', true, false]
    );

    res.status(200).json({ message: 'Signup successful' });

  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// === LOGIN ===
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).send('Invalid email or password');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid email or password');
    }

    // Store user session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
      is_first_login: user.is_first_login
    };

    // First login - force password reset
    if (user.is_first_login) {
      return res.redirect('/reset-password.html');
    }

    // Role-based redirect
    if (user.role === 'admin') {
      return res.redirect('/admin-dashboard.html');
    } else {
      return res.redirect('/employee-dashboard.html');
    }

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send('Server error');
  }
});

// === PASSWORD RESET ===
// === PASSWORD RESET ===
router.post('/reset-password', async (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).send('Unauthorized');
  }

  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).send('New password is required');
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, is_first_login = false WHERE id = $2',
      [hashed, req.session.user.id]
    );

    // Password reset success — now update session and redirect
    req.session.user.is_first_login = false;

    res.redirect('/employee-dashboard.html');

  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).send('Server error');
  }
});

// === LOGOUT ===
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }
    res.redirect('/login.html');
  });
});



module.exports = router;
