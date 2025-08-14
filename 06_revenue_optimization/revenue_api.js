/**
 * revenue_api.js
 *
 * Express API server for revenue optimization management
 */
const express = require('express');
const cors = require('cors');
const RevenueOptimizationService = require('./revenue_optimization_service');

const app = express();
const PORT = process.env.REVENUE_PORT || 3005;

// Initialize revenue optimization service
const revenueService = new RevenueOptimizationService();

// Middleware
app.use(cors());
app.use(express.json());

// A/B Testing Routes

// Create new A/B test
app.post('/api/ab-tests', async (req, res) => {
  try {
    const testConfig = req.body;
    const result = await revenueService.createABTest(testConfig);
    res.json(result);
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
});

// Get A/B test results
app.get('/api/ab-tests/results', async (req, res) => {
  try {
    const results = await revenueService.getABTestResults();
    res.json(results);
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    res.status(500).json({ error: 'Failed to fetch A/B test results' });
  }
});

// Record A/B test conversion
app.post('/api/ab-tests/:testId/conversion', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variantId, subscriberId, revenue = 0 } = req.body;
    
    await revenueService.recordConversion(parseInt(testId), variantId, subscriberId, revenue);
    res.json({ success: true, message: 'Conversion recorded' });
  } catch (error) {
    console.error('Error recording conversion:', error);
    res.status(500).json({ error: 'Failed to record conversion' });
  }
});

// Upsell Campaign Routes

// Generate AI upsell message
app.post('/api/upsell/generate', async (req, res) => {
  try {
    const context = req.body;
    const result = await revenueService.generateUpsellMessage(context);
    res.json(result);
  } catch (error) {
    console.error('Error generating upsell:', error);
    res.status(500).json({ error: 'Failed to generate upsell message' });
  }
});

// Create upsell campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const campaignConfig = req.body;
    const result = await revenueService.createUpsellCampaign(campaignConfig);
    res.json(result);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Execute upsell campaign
app.post('/api/campaigns/:campaignId/execute', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await revenueService.executeCampaign(parseInt(campaignId));
    res.json(result);
  } catch (error) {
    console.error('Error executing campaign:', error);
    res.status(500).json({ error: 'Failed to execute campaign' });
  }
});

// Get campaign performance
app.get('/api/campaigns/performance', async (req, res) => {
  try {
    const performance = await revenueService.getCampaignPerformance();
    res.json(performance);
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({ error: 'Failed to fetch campaign performance' });
  }
});

// Revenue Analytics Routes

// Get revenue analytics
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await revenueService.getRevenueAnalytics(parseInt(days));
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// Quick campaign automation
app.post('/api/automation/quick-campaign', async (req, res) => {
  try {
    const {
      target_segment = 'bronze_tier',
      campaign_name = `Quick Campaign ${Date.now()}`,
      auto_execute = true
    } = req.body;

    console.log(`🚀 Starting quick campaign for ${target_segment}...`);

    // Create campaign
    const campaign = await revenueService.createUpsellCampaign({
      campaign_name,
      target_segment,
      pricing_strategy: 'tier_upgrade',
      message_template: 'AI_GENERATED',
      auto_send: false
    });

    let executionResult = null;
    
    if (auto_execute) {
      // Execute campaign immediately
      executionResult = await revenueService.executeCampaign(campaign.campaignId);
    }

    res.json({
      success: true,
      campaign,
      execution: executionResult,
      message: auto_execute ? 'Campaign created and executed' : 'Campaign created, ready for execution'
    });

  } catch (error) {
    console.error('Error in quick campaign:', error);
    res.status(500).json({ error: 'Failed to create quick campaign' });
  }
});

// Automated A/B test setup
app.post('/api/automation/ab-test-setup', async (req, res) => {
  try {
    const {
      test_type = 'pricing',
      target_metric = 'conversion_rate'
    } = req.body;

    console.log(`🧪 Setting up automated A/B test for ${test_type}...`);

    let testConfig;

    if (test_type === 'pricing') {
      testConfig = {
        test_name: `Pricing Test ${Date.now()}`,
        description: 'Automated pricing optimization test',
        target_metric,
        variants: [
          {
            name: 'Control',
            type: 'pricing',
            config: { discount: 15, base_price: 25 }
          },
          {
            name: 'Higher Discount',
            type: 'pricing',
            config: { discount: 25, base_price: 25 }
          }
        ]
      };
    } else if (test_type === 'messaging') {
      testConfig = {
        test_name: `Message Test ${Date.now()}`,
        description: 'Automated message optimization test',
        target_metric,
        variants: [
          {
            name: 'Formal Tone',
            type: 'message',
            config: { tone: 'professional', urgency: 'low' }
          },
          {
            name: 'Casual Tone',
            type: 'message',
            config: { tone: 'friendly', urgency: 'high' }
          }
        ]
      };
    }

    const result = await revenueService.createABTest(testConfig);

    res.json({
      success: true,
      test: result,
      message: `A/B test for ${test_type} created successfully`,
      next_steps: [
        'Assign users to test variants',
        'Monitor conversions',
        'Analyze results after sufficient sample size'
      ]
    });

  } catch (error) {
    console.error('Error setting up A/B test:', error);
    res.status(500).json({ error: 'Failed to set up A/B test' });
  }
});

// Revenue optimization recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    // Get recent analytics to provide recommendations
    const revenueAnalytics = await revenueService.getRevenueAnalytics(30);
    const campaignPerformance = await revenueService.getCampaignPerformance();
    
    const recommendations = [];
    
    // Analyze campaign performance
    if (campaignPerformance.length > 0) {
      const avgSuccessRate = campaignPerformance.reduce((sum, c) => sum + c.success_rate, 0) / campaignPerformance.length;
      
      if (avgSuccessRate < 10) {
        recommendations.push({
          type: 'campaign_optimization',
          priority: 'high',
          title: 'Improve Campaign Messaging',
          description: 'Your current campaign success rate is below 10%. Consider A/B testing different message tones and offers.',
          action: 'Run messaging A/B test'
        });
      }
      
      if (avgSuccessRate > 20) {
        recommendations.push({
          type: 'scaling',
          priority: 'medium',
          title: 'Scale Successful Campaigns',
          description: 'Your campaigns are performing well. Consider increasing frequency or expanding to new segments.',
          action: 'Create more targeted campaigns'
        });
      }
    }
    
    // Revenue growth recommendations
    const totalRevenue = revenueAnalytics.reduce((sum, r) => sum + r.total_revenue, 0);
    if (totalRevenue > 0) {
      recommendations.push({
        type: 'revenue_growth',
        priority: 'medium',
        title: 'Diversify Revenue Streams',
        description: 'Consider adding PPV bundles and exclusive content offers to boost revenue.',
        action: 'Set up bundle pricing test'
      });
    }
    
    // Add default recommendations if no data
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'getting_started',
        priority: 'high',
        title: 'Launch First Revenue Campaign',
        description: 'Start with a Bronze to Silver tier upgrade campaign to establish baseline performance.',
        action: 'Create quick campaign for bronze_tier segment'
      });
    }

    res.json({
      recommendations,
      generated_at: new Date().toISOString(),
      data_period: '30 days'
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Revenue Optimization',
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`💰 Revenue Optimization API server running on port ${PORT}`);
  console.log(`🔗 Generate upsell: http://localhost:${PORT}/api/upsell/generate`);
  console.log(`🧪 A/B testing: http://localhost:${PORT}/api/ab-tests`);
  console.log(`📊 Recommendations: http://localhost:${PORT}/api/recommendations`);
});

module.exports = app;