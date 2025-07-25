const router = require('express').Router();

// Health check endpoint for /crm
router.get('/', (req, res) => {
  res.json({ status: 'crm module active' });
});

module.exports = router;
