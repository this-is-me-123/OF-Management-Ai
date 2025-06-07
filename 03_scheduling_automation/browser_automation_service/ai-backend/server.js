require('dotenv').config();
const express = require('express');
const supabase = require('./supabase_integration');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware to parse JSON bodies
app.use(express.json());

// Mount routers
app.use('/chat', require('./chat'));
app.use('/ads', require('./ads'));
app.use('/analytics', require('./analytics'));
app.use('/crm', require('./crm'));
app.use('/proxy', require('./proxy'));
app.use('/api/scheduler', require('./scheduler')); // Mount the new scheduler router

// Error handler middleware
const { errorHandler } = require('./utils/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
