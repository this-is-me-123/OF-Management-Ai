require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

console.log('Starting server debug...');

// Middleware to parse JSON bodies
app.use(express.json());

console.log('Basic middleware loaded');

// Basic health check
app.get('/', (req, res) => {
  res.json({ status: 'Debug server running', timestamp: new Date().toISOString() });
});

console.log('Basic routes loaded');

// Load routes one by one with error handling
try {
  console.log('Loading chat router...');
  app.use('/chat', require('./chat'));
  console.log('Chat router loaded successfully');
} catch (e) {
  console.error('Failed to load chat router:', e.message);
}

try {
  console.log('Loading ads router...');
  app.use('/ads', require('./ads'));
  console.log('Ads router loaded successfully');
} catch (e) {
  console.error('Failed to load ads router:', e.message);
}

try {
  console.log('Loading analytics router...');
  app.use('/analytics', require('./analytics'));
  console.log('Analytics router loaded successfully');
} catch (e) {
  console.error('Failed to load analytics router:', e.message);
}

try {
  console.log('Loading CRM router...');
  app.use('/crm', require('./crm'));
  console.log('CRM router loaded successfully');
} catch (e) {
  console.error('Failed to load CRM router:', e.message);
}

try {
  console.log('Loading proxy router...');
  app.use('/proxy', require('./proxy'));
  console.log('Proxy router loaded successfully');
} catch (e) {
  console.error('Failed to load proxy router:', e.message);
}

try {
  console.log('Loading scheduler router...');
  app.use('/api/scheduler', require('./scheduler'));
  console.log('Scheduler router loaded successfully');
} catch (e) {
  console.error('Failed to load scheduler router:', e.message);
}

try {
  console.log('Loading error handler...');
  const { errorHandler } = require('./utils/errorHandler');
  app.use(errorHandler);
  console.log('Error handler loaded successfully');
} catch (e) {
  console.error('Failed to load error handler:', e.message);
}

console.log('Starting server...');
app.listen(PORT, () => {
  console.log(`🚀 Debug Server running on port ${PORT}`);
});