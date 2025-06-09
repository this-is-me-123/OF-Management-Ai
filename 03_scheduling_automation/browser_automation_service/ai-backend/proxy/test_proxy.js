const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

const url = 'https://ip.decodo.com/json';
const proxyAgent = new HttpsProxyAgent(
  'http://sp1zc2s6xq:g65f~B5iJ0qyidEvLd@us.decodo.com:10000');

axios
  .get(url, {
    httpsAgent: proxyAgent,
  })
  .then((response) => {
    console.log(response.data);
  });