// ofem_integration_controller.js
// OnlyFans Enterprise Management Integration Controller
// Central orchestration hub for all OFEM modules and services

const OFEMApiService = require('./05_crm_subscriber_management/ofem_api_service');
const AnalyticsIntegrationService = require('./07_analytics_reporting/analytics_integration_service');
const { publishPost } = require('./03_scheduling_automation/publishService');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class OFEMIntegrationController {
  constructor() {
    // Initialize all service modules
    this.crmService = new OFEMApiService();
    this.analyticsService = new AnalyticsIntegrationService();
    
    // Configuration
    this.config = {
      automatedCampaignsEnabled: true,
      analyticsSchedule: '0 */6 * * *', // Every 6 hours
      anomalyDetectionSchedule: '0 8 * * *', // Daily at 8 AM
      campaignSchedule: '0 10 * * *', // Daily at 10 AM
    };

    // Initialize scheduled tasks
    this.initializeScheduledTasks();
    
    console.log('🚀 OFEM Integration Controller initialized');
  }

  /**
   * Initialize automated scheduled tasks
   */
  initializeScheduledTasks() {
    // Analytics data extraction - every 6 hours
    cron.schedule(this.config.analyticsSchedule, async () => {
      console.log('⏰ Running scheduled analytics extraction...');
      await this.runAnalyticsExtraction();
    });

    // Anomaly detection - daily at 8 AM
    cron.schedule(this.config.anomalyDetectionSchedule, async () => {
      console.log('⏰ Running scheduled anomaly detection...');
      await this.runAnomalyDetection();
    });

    // Automated campaigns - daily at 10 AM
    cron.schedule(this.config.campaignSchedule, async () => {
      console.log('⏰ Running scheduled campaigns...');
      await this.runAutomatedCampaigns();
    });

    console.log('📅 Scheduled tasks initialized');
  }

  /**
   * Run comprehensive analytics extraction
   */
  async runAnalyticsExtraction() {
    try {
      console.log('📊 Starting analytics extraction process...');
      
      // Extract OnlyFans data
      const dailyMetrics = await this.analyticsService.extractOnlyFansData();
      
      // Generate insights
      const insights = await this.analyticsService.generateInsights();
      
      // Log results
      console.log(`✅ Analytics extraction completed. Metrics: ${Object.keys(dailyMetrics).length}, Insights: ${insights.length}`);
      
      return {
        success: true,
        dailyMetrics,
        insights,
        extractedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Analytics extraction failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run anomaly detection and alert generation
   */
  async runAnomalyDetection() {
    try {
      console.log('🔍 Starting anomaly detection...');
      
      const anomalies = await this.analyticsService.detectAnomalies();
      
      // Process high-severity anomalies
      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
      
      if (highSeverityAnomalies.length > 0) {
        await this.handleHighSeverityAnomalies(highSeverityAnomalies);
      }
      
      console.log(`✅ Anomaly detection completed. Found ${anomalies.length} anomalies (${highSeverityAnomalies.length} high severity)`);
      
      return {
        success: true,
        totalAnomalies: anomalies.length,
        highSeverity: highSeverityAnomalies.length,
        anomalies
      };
      
    } catch (error) {
      console.error('❌ Anomaly detection failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle high-severity anomalies with automated responses
   */
  async handleHighSeverityAnomalies(anomalies) {
    try {
      for (const anomaly of anomalies) {
        console.log(`🚨 Handling high-severity anomaly: ${anomaly.description}`);
        
        switch (anomaly.metric_name) {
          case 'new_subscribers':
            if (anomaly.actual_value < anomaly.expected_value) {
              // Low subscriber growth - trigger retention campaign
              await this.triggerRetentionCampaign();
            }
            break;
            
          case 'total_revenue':
            if (anomaly.actual_value < anomaly.expected_value) {
              // Revenue drop - trigger upsell campaign
              await this.triggerUpsellCampaign();
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error handling anomalies:', error);
    }
  }

  /**
   * Run automated marketing campaigns
   */
  async runAutomatedCampaigns() {
    try {
      if (!this.config.automatedCampaignsEnabled) {
        console.log('⏸️ Automated campaigns are disabled');
        return;
      }

      console.log('🎯 Starting automated campaigns...');
      
      const campaigns = [
        await this.runNewSubscriberWelcomeCampaign(),
        await this.runAtRiskRetentionCampaign(),
        await this.runHighValueUpsellCampaign()
      ];

      const totalMessages = campaigns.reduce((sum, campaign) => sum + (campaign.successCount || 0), 0);
      
      console.log(`✅ Automated campaigns completed. Total messages sent: ${totalMessages}`);
      
      return {
        success: true,
        campaigns,
        totalMessages
      };
      
    } catch (error) {
      console.error('❌ Automated campaigns failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Welcome campaign for new subscribers
   */
  async runNewSubscriberWelcomeCampaign() {
    try {
      const campaignId = this.crmService.createCampaign({
        name: 'New Subscriber Welcome',
        type: 'welcome',
        target_segment: 'new_subscribers',
        template_name: 'tier1_welcome',
        status: 'running'
      });

      const result = await this.crmService.runCampaign(campaignId);
      console.log(`👋 Welcome campaign: ${result.successCount}/${result.targetCount} messages sent`);
      
      return result;
    } catch (error) {
      console.error('Error running welcome campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retention campaign for at-risk subscribers
   */
  async runAtRiskRetentionCampaign() {
    try {
      const campaignId = this.crmService.createCampaign({
        name: 'At-Risk Retention',
        type: 'retention',
        target_segment: 'at_risk',
        template_name: 'retention_offer',
        status: 'running'
      });

      const result = await this.crmService.runCampaign(campaignId);
      console.log(`🛡️ Retention campaign: ${result.successCount}/${result.targetCount} messages sent`);
      
      return result;
    } catch (error) {
      console.error('Error running retention campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upsell campaign for high-value subscribers
   */
  async runHighValueUpsellCampaign() {
    try {
      const campaignId = this.crmService.createCampaign({
        name: 'High Value Upsell',
        type: 'upsell',
        target_segment: 'high_value',
        template_name: 'premium_bundle_promo',
        status: 'running'
      });

      const result = await this.crmService.runCampaign(campaignId);
      console.log(`💰 Upsell campaign: ${result.successCount}/${result.targetCount} messages sent`);
      
      return result;
    } catch (error) {
      console.error('Error running upsell campaign:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Trigger emergency retention campaign
   */
  async triggerRetentionCampaign() {
    try {
      console.log('🚨 Triggering emergency retention campaign...');
      await this.runAtRiskRetentionCampaign();
    } catch (error) {
      console.error('Error triggering retention campaign:', error);
    }
  }

  /**
   * Trigger emergency upsell campaign
   */
  async triggerUpsellCampaign() {
    try {
      console.log('🚨 Triggering emergency upsell campaign...');
      await this.runHighValueUpsellCampaign();
    } catch (error) {
      console.error('Error triggering upsell campaign:', error);
    }
  }

  /**
   * Publish content using integrated scheduling service
   */
  async publishContent(contentData) {
    try {
      const post = {
        id: contentData.id || `post_${Date.now()}`,
        platform: 'onlyfans',
        content: contentData.text,
        media: contentData.media || [],
        scheduledTime: contentData.scheduledTime,
        tags: contentData.tags || []
      };

      const result = await publishPost(post);
      
      // Track in analytics
      if (result.success) {
        // TODO: Update content performance tracking
        console.log(`📤 Content published successfully: Job ID ${result.jobId}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error publishing content:', error);
      throw error;
    }
  }

  /**
   * Add subscriber to CRM system
   */
  async addSubscriber(subscriberData) {
    try {
      const result = await this.crmService.addSubscriber(subscriberData);
      
      // If new subscriber, trigger welcome message
      if (result && subscriberData.subscription_start) {
        const subscriptionDate = new Date(subscriberData.subscription_start);
        const now = new Date();
        const hoursSinceSubscription = (now - subscriptionDate) / (1000 * 60 * 60);
        
        // Send welcome message if subscribed within last 24 hours
        if (hoursSinceSubscription <= 24) {
          setTimeout(async () => {
            try {
              await this.crmService.sendPersonalizedMessage(
                result, 
                'tier1_welcome',
                { welcome_bonus: 'exclusive content' }
              );
            } catch (error) {
              console.error('Error sending welcome message:', error);
            }
          }, 5000); // Delay welcome message by 5 seconds
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error adding subscriber:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive system status
   */
  async getSystemStatus() {
    try {
      // Get analytics data
      const dashboardData = this.analyticsService.getDashboardData();
      
      // Get CRM analytics
      const crmAnalytics = this.crmService.getAnalytics();
      
      // Get recent job status
      const pendingJobs = require('./03_scheduling_automation/publishService').getPendingJobs();
      
      return {
        timestamp: new Date().toISOString(),
        analytics: dashboardData,
        crm: crmAnalytics,
        automation: {
          pendingJobs: pendingJobs.length,
          recentJobs: pendingJobs.slice(0, 5)
        },
        system: {
          config: this.config,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        }
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      return { error: error.message };
    }
  }

  /**
   * Manually trigger specific campaign
   */
  async triggerCampaign(campaignType, segment = null) {
    try {
      switch (campaignType) {
        case 'welcome':
          return await this.runNewSubscriberWelcomeCampaign();
        case 'retention':
          return await this.runAtRiskRetentionCampaign();
        case 'upsell':
          return await this.runHighValueUpsellCampaign();
        default:
          throw new Error(`Unknown campaign type: ${campaignType}`);
      }
    } catch (error) {
      console.error(`Error triggering ${campaignType} campaign:`, error);
      throw error;
    }
  }

  /**
   * Export comprehensive analytics report
   */
  async exportAnalyticsReport(format = 'json') {
    try {
      const status = await this.getSystemStatus();
      const exportPath = path.join(__dirname, 'reports', `ofem_report_${Date.now()}.${format}`);
      
      // Ensure reports directory exists
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
      
      if (format === 'json') {
        await fs.writeFile(exportPath, JSON.stringify(status, null, 2));
      } else if (format === 'csv') {
        // Convert to CSV format (simplified)
        const csvData = [
          ['Metric', 'Value'],
          ['Total Subscribers', status.crm.totalSubscribers],
          ['Recent Messages', status.crm.recentMessages],
          ['Total Revenue', status.crm.totalRevenue],
          ['Pending Jobs', status.automation.pendingJobs],
          ['System Uptime', status.system.uptime]
        ].map(row => row.join(',')).join('\n');
        
        await fs.writeFile(exportPath, csvData);
      }
      
      console.log(`📊 Analytics report exported to: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('Error exporting analytics report:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      console.log('🛑 Shutting down OFEM Integration Controller...');
      
      // Close database connections
      this.crmService.close();
      this.analyticsService.close();
      
      console.log('✅ OFEM Integration Controller shut down successfully');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

module.exports = OFEMIntegrationController;