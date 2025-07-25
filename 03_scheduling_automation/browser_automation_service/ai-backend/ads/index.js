const router = require('express').Router();

// Health check endpoint for /ads
router.get('/', (req, res) => {
  res.json({ status: 'ads module active' });
});

module.exports = router;
