const router = require('express').Router();

// Health check endpoint for /chat
router.get('/', (req, res) => {
  res.json({ status: 'chat module active' });
});

// Mount chatRouter.js for /send and /receive endpoints
const chatRouter = require('./chatRouter');
router.use('/', chatRouter);

module.exports = router;
