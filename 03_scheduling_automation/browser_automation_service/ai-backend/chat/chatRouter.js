// Chat router handling chat endpoints
const express = require('express');
const router = express.Router();

// TODO: Implement chat endpoints
router.post('/send', (req, res) => {
  res.send('Chat send endpoint');
});

router.get('/receive', (req, res) => {
  res.send('Chat receive endpoint');
});

module.exports = router;
