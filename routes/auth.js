// auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// === SIGNUP (Used only by employee self-registration) ===
router.post('/signup', async (req, res) => {
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
      `INSERT INTO users (fullname, email, password, role, is_first_login, default_password)
       VALUES ($1, $2, $3, 'employee', true, false)`,
      [fullname, email, hashedPassword]
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

    req.session.userId = user.id;
    req.session.userRole = user.role;

    if (user.is_first_login) {
      return res.status(200).json({ redirectTo: '/reset-password.html' });
    }

    return res.status(200).json({
      message: 'Login successful',
      redirectTo: user.role === 'admin' ? '/admin-dashboard.html' : '/employee-dashboard.html'
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send('Server error');
  }
});

// === PASSWORD RESET ===
router.post('/reset-password', async (req, res) => {
  const userId = req.session.userId;
  const { newPassword } = req.body;

  if (!userId) {
    return res.status(401).send('Unauthorized');
  }

  if (!newPassword) {
    return res.status(400).send('New password is required');
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1, is_first_login = false, default_password = false WHERE id = $2',
      [hashed, userId]
    );

    res.status(200).json({ message: 'Password reset successful', redirectTo: '/employee-dashboard.html' });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).send('Server error');
  }
});

// === LOGOUT ===
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Logout failed");
    }

    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: false
    });

    return res.redirect('/login.html');
  });
});

// === SESSION CHECK ===
router.get('/api/check-session', (req, res) => {
  if (req.session && req.session.userId) {
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

module.exports = router;
