// === server.js ===
const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Route modules
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

// === Middleware ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', adminRoutes);
app.use('/admin', adminRoutes); // Now /admin/employees and /admin/onboard will work


// === Session Middleware ===
app.use(session({
  secret: 'your-secret-key', // Use a secure secret in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // true if using HTTPS
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// === Cache-Control Headers for All Requests ===
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// === Static Files ===
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// === Route File Mounting ===
app.use('/', authRoutes);               // Auth: login, signup, reset-password, logout
app.use('/admin', adminRoutes);         // Admin dashboard APIs
app.use('/employee', employeeRoutes);   // Employee profile & dashboard APIs

// === HTML Routing for Specific Pages ===
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/view-profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-profile.html'));
});

app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-onboarding.html'));
});

// === Start the Server ===
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

