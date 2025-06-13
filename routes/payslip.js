const express = require('express');
const router = express.Router();
const generatePayslip = require('../utils/payslipGenerator');

// Dummy user data - Replace with DB query in real app
router.post('/download-payslip', (req, res) => {
  const { name, email, month } = req.body;

  const userData = {
    name,
    email,
    month,
    basic: 40000,
    hra: 10000,
    allowances: 5000,
    deductions: 3000,
    net: 52000
  };

  generatePayslip(res, userData);
});

module.exports = router;

