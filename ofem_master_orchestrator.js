/**
 * ofem_master_orchestrator.js
 *
 * Master orchestration system for the OFEM platform
 * Coordinates all services: AI Chat, Scheduling, CRM, Content Generation, Analytics, Revenue Optimization
 */
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

class OFEMMasterOrchestrator {
  constructor() {
    this.services = {
      scheduler: { url: 'http://localhost:3001', status: 'unknown' },
      crm: { url: 'http://localhost:3002', status: 'unknown' },
      analytics: { url: 'http://localhost:3003', status: 'unknown' },
      content: { url: 'http://localhost:3004', status: 'unknown' },
      revenue: { url: 'http://localhost:3005', status: 'unknown' }
    };
    
    this.setupHealthChecks();
    this.setupAutomatedWorkflows();
  }

  async setupHealthChecks() {
    // Check service health every 30 seconds
    setInterval(async () => {
      await this.checkAllServices();
    }, 30000);

    // Initial health check
    setTimeout(() => this.checkAllServices(), 5000);
  }

  async checkAllServices() {
    for (const [serviceName, service] of Object.entries(this.services)) {
      try {
        const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
        service.status = response.status === 200 ? 'healthy' : 'unhealthy';
        service.lastCheck = new Date().toISOString();
      } catch (error) {
        service.status = 'down';
        service.lastCheck = new Date().toISOString();
        service.error = error.message;
      }
    }
  }

  setupAutomatedWorkflows() {
    console.log('🤖 Setting up automated OFEM workflows...');

    // Daily content generation and scheduling workflow
    cron.schedule('0 9 * * *', async () => {
      console.log('🎨 Running daily content generation workflow...');
      await this.dailyContentWorkflow();
    });

    // Weekly revenue optimization campaign
    cron.schedule('0 10 * * 1', async () => {
      console.log('💰 Running weekly revenue optimization...');
      await this.weeklyRevenueOptimization();
    });

    // Daily analytics and insights
    cron.schedule('0 8 * * *', async () => {
      console.log('📊 Running daily analytics compilation...');
      await this.dailyAnalyticsWorkflow();
    });

    // Hourly CRM maintenance
    cron.schedule('0 * * * *', async () => {
      console.log('👥 Running CRM maintenance tasks...');
      await this.crmMaintenanceWorkflow();
    });
  }

  // Orchestrated Workflows

  async dailyContentWorkflow() {
    try {
      console.log('📅 Starting daily content generation and scheduling workflow...');

      // Step 1: Check analytics for content performance insights
      const analyticsData = await this.callService('analytics', '/api/dashboard');
      
      // Step 2: Generate content based on performance data
      const contentParams = {
        schedule_count: 3,
        days_ahead: 1,
        content_mix: { photo: 0.7, selfie: 0.3 }
      };

      if (analyticsData?.overview?.engagement?.weekly_engagement_rate > 15) {
        // High engagement - create more content
        contentParams.schedule_count = 5;
      }

      const contentResult = await this.callService('content', '/api/workflow/auto-generate', contentParams);
      
      console.log(`✅ Daily content workflow completed: ${contentResult?.results?.length || 0} posts generated`);
      
      return {
        success: true,
        content_generated: contentResult?.results?.length || 0,
        engagement_driven: analyticsData?.overview?.engagement?.weekly_engagement_rate > 15
      };

    } catch (error) {
      console.error('❌ Daily content workflow failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async weeklyRevenueOptimization() {
    try {
      console.log('💸 Starting weekly revenue optimization workflow...');

      // Step 1: Get subscriber analytics
      const subscriberStats = await this.callService('crm', '/api/subscribers/stats');
      
      // Step 2: Get revenue recommendations
      const recommendations = await this.callService('revenue', '/api/recommendations');
      
      // Step 3: Execute automated campaigns based on recommendations
      const campaigns = [];
      
      if (recommendations?.recommendations) {
        for (const rec of recommendations.recommendations.slice(0, 2)) { // Limit to 2 campaigns
          if (rec.action === 'Create quick campaign for bronze_tier segment') {
            const campaignResult = await this.callService('revenue', '/api/automation/quick-campaign', {
              target_segment: 'bronze_tier',
              auto_execute: true
            });
            campaigns.push(campaignResult);
          }
        }
      }
      
      console.log(`✅ Weekly revenue optimization completed: ${campaigns.length} campaigns executed`);
      
      return {
        success: true,
        recommendations_count: recommendations?.recommendations?.length || 0,
        campaigns_executed: campaigns.length,
        total_subscribers: subscriberStats?.total || 0
      };

    } catch (error) {
      console.error('❌ Weekly revenue optimization failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async dailyAnalyticsWorkflow() {
    try {
      console.log('📈 Starting daily analytics compilation...');

      // Step 1: Run ETL pipeline
      // Note: Would normally call a Python script here
      console.log('🔄 ETL pipeline would run here (Python script)');

      // Step 2: Get updated dashboard data
      const dashboardData = await this.callService('analytics', '/api/dashboard');
      
      // Step 3: Check for anomalies
      const anomalies = await this.callService('analytics', '/api/anomalies');
      
      // Step 4: Get churn predictions
      const churnPredictions = await this.callService('analytics', '/api/churn-predictions');
      
      // Step 5: If high-risk churners detected, trigger retention campaign
      if (churnPredictions?.length > 0) {
        const highRiskUsers = churnPredictions.filter(p => p.risk_level === 'high');
        
        if (highRiskUsers.length > 0) {
          console.log(`🚨 ${highRiskUsers.length} high-risk churn users detected, triggering retention...`);
          await this.callService('crm', '/api/automation/retention');
        }
      }

      console.log('✅ Daily analytics workflow completed');
      
      return {
        success: true,
        anomalies_detected: anomalies?.anomalies?.length || 0,
        high_risk_churners: churnPredictions?.filter(p => p.risk_level === 'high')?.length || 0
      };

    } catch (error) {
      console.error('❌ Daily analytics workflow failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async crmMaintenanceWorkflow() {
    try {
      // Run automated CRM processes
      await this.callService('crm', '/api/automation/onboarding');
      
      // Update subscriber stats
      const stats = await this.callService('crm', '/api/subscribers/stats');
      
      return {
        success: true,
        total_subscribers: stats?.total || 0,
        active_subscribers: stats?.active || 0
      };

    } catch (error) {
      console.error('❌ CRM maintenance workflow failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Service Communication Helper
  async callService(serviceName, endpoint, data = null, method = 'GET') {
    const service = this.services[serviceName];
    if (!service || service.status !== 'healthy') {
      throw new Error(`Service ${serviceName} is not available`);
    }

    try {
      const config = {
        method,
        url: `${service.url}${endpoint}`,
        timeout: 30000
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`Error calling ${serviceName}${endpoint}:`, error.message);
      throw error;
    }
  }

  // Master Dashboard Data Aggregation
  async getMasterDashboard() {
    try {
      const [
        schedulerStats,
        crmStats,
        analyticsData,
        revenueAnalytics
      ] = await Promise.allSettled([
        this.callService('scheduler', '/api/stats'),
        this.callService('crm', '/api/subscribers/stats'),
        this.callService('analytics', '/api/kpis'),
        this.callService('revenue', '/api/analytics/revenue?days=7')
      ]);

      return {
        system_status: this.services,
        content_scheduling: schedulerStats.status === 'fulfilled' ? schedulerStats.value : null,
        subscriber_management: crmStats.status === 'fulfilled' ? crmStats.value : null,
        analytics_overview: analyticsData.status === 'fulfilled' ? analyticsData.value : null,
        revenue_metrics: revenueAnalytics.status === 'fulfilled' ? revenueAnalytics.value : null,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error aggregating master dashboard:', error);
      throw error;
    }
  }

  // Cross-Service Operations
  async createFullContentCampaign(campaignConfig) {
    try {
      const {
        content_count = 5,
        target_segment = 'all',
        include_upsell = true,
        schedule_days_ahead = 7
      } = campaignConfig;

      console.log('🚀 Creating full content campaign...');

      // Step 1: Generate content batch
      const contentBatch = await this.callService('content', '/api/generate/batch', {
        count: content_count,
        options: { include_image: true, include_caption: true }
      });

      // Step 2: Schedule content with optimal timing
      const scheduleResults = [];
      if (contentBatch.packages) {
        for (let i = 0; i < contentBatch.packages.length; i++) {
          const pkg = contentBatch.packages[i];
          const scheduleDate = new Date();
          scheduleDate.setDate(scheduleDate.getDate() + Math.floor(i * schedule_days_ahead / content_count));
          scheduleDate.setHours(19 + (i % 3), 0, 0); // Vary posting times

          if (pkg.package_id) {
            const scheduleResult = await this.callService('content', `/api/schedule/${pkg.package_id}`, {
              scheduleTime: scheduleDate.toISOString()
            });
            scheduleResults.push(scheduleResult);
          }
        }
      }

      // Step 3: Create upsell campaign if requested
      let upsellCampaign = null;
      if (include_upsell) {
        upsellCampaign = await this.callService('revenue', '/api/automation/quick-campaign', {
          target_segment,
          auto_execute: false // Manual review recommended
        });
      }

      return {
        success: true,
        content_generated: contentBatch.packages?.length || 0,
        content_scheduled: scheduleResults.length,
        upsell_campaign: upsellCampaign,
        campaign_duration_days: schedule_days_ahead
      };

    } catch (error) {
      console.error('❌ Full content campaign failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Express API Setup
const app = express();
const PORT = process.env.MASTER_PORT || 3000;

// Initialize orchestrator
const orchestrator = new OFEMMasterOrchestrator();

app.use(cors());
app.use(express.json());

// Master Dashboard Routes
app.get('/api/dashboard', async (req, res) => {
  try {
    const dashboard = await orchestrator.getMasterDashboard();
    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching master dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch master dashboard' });
  }
});

// System Health
app.get('/api/system/health', (req, res) => {
  res.json({
    orchestrator_status: 'healthy',
    services: orchestrator.services,
    timestamp: new Date().toISOString()
  });
});

// Workflow Management
app.post('/api/workflows/content-campaign', async (req, res) => {
  try {
    const result = await orchestrator.createFullContentCampaign(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error creating content campaign:', error);
    res.status(500).json({ error: 'Failed to create content campaign' });
  }
});

app.post('/api/workflows/daily-content', async (req, res) => {
  try {
    const result = await orchestrator.dailyContentWorkflow();
    res.json(result);
  } catch (error) {
    console.error('Error running daily content workflow:', error);
    res.status(500).json({ error: 'Failed to run daily content workflow' });
  }
});

app.post('/api/workflows/revenue-optimization', async (req, res) => {
  try {
    const result = await orchestrator.weeklyRevenueOptimization();
    res.json(result);
  } catch (error) {
    console.error('Error running revenue optimization:', error);
    res.status(500).json({ error: 'Failed to run revenue optimization' });
  }
});

// Service Proxy Routes (for unified API access)
app.use('/api/scheduler', async (req, res) => {
  try {
    const result = await orchestrator.callService('scheduler', req.path, req.body, req.method);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/crm', async (req, res) => {
  try {
    const result = await orchestrator.callService('crm', req.path, req.body, req.method);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/content', async (req, res) => {
  try {
    const result = await orchestrator.callService('content', req.path, req.body, req.method);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/analytics', async (req, res) => {
  try {
    const result = await orchestrator.callService('analytics', req.path, req.body, req.method);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/revenue', async (req, res) => {
  try {
    const result = await orchestrator.callService('revenue', req.path, req.body, req.method);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'OFEM Master Orchestrator',
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎯 OFEM Master Orchestrator started successfully!');
  console.log(`🔗 Master Dashboard: http://localhost:${PORT}/api/dashboard`);
  console.log(`⚡ System Health: http://localhost:${PORT}/api/system/health`);
  console.log(`🚀 Content Campaign: http://localhost:${PORT}/api/workflows/content-campaign`);
  console.log('');
  console.log('🌟 OFEM Platform Services:');
  console.log('   📅 Scheduler API: http://localhost:3001');
  console.log('   👥 CRM API: http://localhost:3002'); 
  console.log('   📊 Analytics API: http://localhost:3003');
  console.log('   🎨 Content API: http://localhost:3004');
  console.log('   💰 Revenue API: http://localhost:3005');
});

module.exports = { OFEMMasterOrchestrator, app };