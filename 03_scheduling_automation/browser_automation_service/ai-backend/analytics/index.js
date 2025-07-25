const router = require('express').Router();

// Health check endpoint for /analytics
router.get('/', (req, res) => {
  res.json({ status: 'analytics module active' });
});

module.exports = router;
