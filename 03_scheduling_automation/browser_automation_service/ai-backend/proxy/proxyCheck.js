const express = require('express');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const router = express.Router();

router.get('/proxy-check', async (req, res) => {
  const url = 'https://ip.decodo.com/json';
  const proxyUrl = `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    const response = await axios.get(url, { httpsAgent: agent });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
