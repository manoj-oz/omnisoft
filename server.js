const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const authRoutes = require('./routes/auth'); // ✅ Only once

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML pages
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-onboarding.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Route modules
const adminRoutes = require('./routes/adminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

app.use('/admin', adminRoutes);
app.use('/employee', employeeRoutes);
app.use('/', authRoutes); // ✅ Auth should be last

// Start server
app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
