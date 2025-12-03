const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ success: true, token: 'dummy-token', user: { id: '1', name: 'Test User', role: 'patient' } });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'User registered' });
});

module.exports = router;
