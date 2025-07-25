const express = require('express');
const router = express.Router();

// Health check endpoint for /proxy
router.get('/', (req, res) => {
  res.json({ status: 'proxy module active' });
});

module.exports = router;
