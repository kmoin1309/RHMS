const express = require('express');
const router = express.Router();

router.get('/pending-reviews', (req, res) => {
  res.json({ success: true, data: { appointments: [] } });
});

module.exports = router;
