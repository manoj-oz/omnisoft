const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Add a new employee
router.post('/add', async (req, res) => {
  const { fullname, email, phone, designation, department, doj } = req.body;
  try {
    await pool.query(
      'INSERT INTO employees (fullname, email, phone, designation, department, doj) VALUES ($1, $2, $3, $4, $5, $6)',
      [fullname, email, phone, designation, department, doj]
    );
    res.status(201).send('Employee added');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
