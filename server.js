const express = require('express');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// === Middleware Imports ===
const checkAdminAuth = require('./middleware/checkAdminAuth');
const checkEmployeeAuth = require('./middleware/checkEmployeeAuth');
const checkSuperAdminAuth = require('./middleware/checkSuperAdminAuth');

// === Middleware Setup ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Session Setup ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 30 // 30 minutes
  }
}));

// === Prevent Caching ===
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// === Static Files ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// === Super Admin Routes ===
app.get('/superAdmin-dashboard.html', checkSuperAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'superAdmin-dashboard.html'));
});
app.get('/add-admin.html', checkSuperAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'add-admin.html'));
});

// === Admin Routes ===
app.get('/admin-dashboard.html', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});
app.get('/employee-onboarding.html', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-onboarding.html'));
});
app.get('/employee-directory.html', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-directory.html'));
});
app.get('/admin-documents.html', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-documents.html'));
});
app.get('/leave-management.html', checkAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'leave-management.html'));
});

// === Employee Routes ===
app.get('/employee-dashboard.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
});
app.get('/employee-leave.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee-leave.html'));
});
app.get('/employee_documents.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'employee_documents.html'));
});
app.get('/reset-password.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});
app.get('/view-profile.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-profile.html'));
});
app.get('/timesheet.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'timesheet.html'));
});
app.get('/view-timesheet.html', checkEmployeeAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view-timesheet.html'));
});

// === Public Fallback Route (optional) ===
app.get('/', (req, res) => {
  res.send('Welcome to OmniSoft QA Portal Backend');
});

// === Routes Integration ===
const superAdminRoutes = require('./routes/superAdminRoutes');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

app.use('/', superAdminRoutes);
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/employee', employeeRoutes);

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
