/**
 * crm_api.js
 *
 * Express API server for CRM management
 */
const express = require('express');
const cors = require('cors');
const CRMAutomation = require('./crm_automation');

const app = express();
const PORT = process.env.CRM_PORT || 3002;

// Initialize CRM
const crm = new CRMAutomation();
crm.startAutomation();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/subscribers/stats', async (req, res) => {
  try {
    const stats = await crm.getSubscriberStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching subscriber stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.post('/api/subscribers', async (req, res) => {
  try {
    const { username, email, tier, totalSpent } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const subscriberId = await crm.addSubscriber({
      username,
      email,
      tier,
      totalSpent
    });
    
    res.json({ success: true, subscriberId, message: 'Subscriber added successfully' });
  } catch (error) {
    console.error('Error adding subscriber:', error);
    res.status(500).json({ error: 'Failed to add subscriber' });
  }
});

app.put('/api/subscribers/:username/activity', async (req, res) => {
  try {
    const { username } = req.params;
    const changes = await crm.updateSubscriberActivity(username);
    
    res.json({ success: true, changes, message: 'Activity updated' });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

app.post('/api/automation/onboarding', async (req, res) => {
  try {
    await crm.processNewSubscribers();
    res.json({ success: true, message: 'Onboarding automation triggered' });
  } catch (error) {
    console.error('Error running onboarding:', error);
    res.status(500).json({ error: 'Failed to run onboarding automation' });
  }
});

app.post('/api/automation/retention', async (req, res) => {
  try {
    await crm.processRetentionCampaign();
    res.json({ success: true, message: 'Retention campaign triggered' });
  } catch (error) {
    console.error('Error running retention:', error);
    res.status(500).json({ error: 'Failed to run retention campaign' });
  }
});

app.post('/api/automation/churn-prevention', async (req, res) => {
  try {
    await crm.processChurnPrevention();
    res.json({ success: true, message: 'Churn prevention triggered' });
  } catch (error) {
    console.error('Error running churn prevention:', error);
    res.status(500).json({ error: 'Failed to run churn prevention' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎯 CRM API server running on port ${PORT}`);
  console.log(`🔗 CRM dashboard: http://localhost:${PORT}/api/subscribers/stats`);
});

module.exports = app;