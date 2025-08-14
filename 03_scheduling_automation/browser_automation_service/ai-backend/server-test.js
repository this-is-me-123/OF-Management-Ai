require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ status: 'Test server running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
});