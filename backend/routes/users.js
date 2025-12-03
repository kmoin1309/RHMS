const express = require('express');
const router = express.Router();

router.get('/profile', (req, res) => {
  res.json({ success: true, user: { id: '1', name: 'Test User' } });
});

module.exports = router;
