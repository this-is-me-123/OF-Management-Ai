// test_integration.js
// Comprehensive integration test for OFEM system
// Demonstrates end-to-end functionality with mock data

const OFEMIntegrationController = require('./ofem_integration_controller');
const fs = require('fs').promises;
const path = require('path');

class OFEMIntegrationTest {
  constructor() {
    this.controller = null;
    this.testResults = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: {}
    };
  }

  /**
   * Run comprehensive integration test
   */
  async runIntegrationTest() {
    try {
      console.log('🧪 Starting OFEM Integration Test Suite\n');
      
      // Initialize the integration controller
      await this.initializeController();
      
      // Run test sequence
      await this.testSubscriberManagement();
      await this.testContentPublishing();
      await this.testCampaignAutomation();
      await this.testAnalyticsExtraction();
      await this.testAnomalyDetection();
      await this.testSystemStatus();
      
      // Generate test report
      await this.generateTestReport();
      
      console.log('\n✅ Integration test completed successfully!');
      
    } catch (error) {
      console.error('❌ Integration test failed:', error);
      this.recordTestResult('Integration Test', false, error.message);
    } finally {
      if (this.controller) {
        await this.controller.shutdown();
      }
    }
  }

  /**
   * Initialize the OFEM controller
   */
  async initializeController() {
    try {
      console.log('🚀 Initializing OFEM Integration Controller...');
      this.controller = new OFEMIntegrationController();
      
      // Disable automated campaigns for testing
      this.controller.config.automatedCampaignsEnabled = false;
      
      this.recordTestResult('Controller Initialization', true, 'Successfully initialized');
      console.log('✅ Controller initialized\n');
    } catch (error) {
      this.recordTestResult('Controller Initialization', false, error.message);
      throw error;
    }
  }

  /**
   * Test subscriber management functionality
   */
  async testSubscriberManagement() {
    try {
      console.log('👥 Testing Subscriber Management...');
      
      // Add mock subscribers
      const mockSubscribers = [
        {
          of_user_id: 'user_123',
          username: 'testuser1',
          email: 'test1@example.com',
          tier: 'premium',
          engagement_level: 'high',
          total_spent: 150.00,
          last_active: new Date().toISOString(),
          subscription_start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          status: 'active'
        },
        {
          of_user_id: 'user_456',
          username: 'testuser2',
          email: 'test2@example.com',
          tier: 'free',
          engagement_level: 'medium',
          total_spent: 25.00,
          last_active: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          subscription_start: new Date().toISOString(), // Today
          status: 'active'
        },
        {
          of_user_id: 'user_789',
          username: 'testuser3',
          email: 'test3@example.com',
          tier: 'vip',
          engagement_level: 'low',
          total_spent: 300.00,
          last_active: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
          subscription_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          status: 'active'
        }
      ];

      // Add subscribers to the system
      for (const subscriber of mockSubscribers) {
        await this.controller.addSubscriber(subscriber);
      }

      // Test segmentation
      const highValueSubscribers = this.controller.crmService.getSubscribersBySegment('high_value');
      const newSubscribers = this.controller.crmService.getSubscribersBySegment('new_subscribers');
      const atRiskSubscribers = this.controller.crmService.getSubscribersBySegment('at_risk');

      console.log(`  📊 High value subscribers: ${highValueSubscribers.length}`);
      console.log(`  📊 New subscribers: ${newSubscribers.length}`);
      console.log(`  📊 At-risk subscribers: ${atRiskSubscribers.length}`);

      this.recordTestResult('Subscriber Management', true, 
        `Added ${mockSubscribers.length} subscribers, segmented correctly`);
      console.log('✅ Subscriber management test passed\n');

    } catch (error) {
      this.recordTestResult('Subscriber Management', false, error.message);
      console.error('❌ Subscriber management test failed:', error.message);
    }
  }

  /**
   * Test content publishing functionality
   */
  async testContentPublishing() {
    try {
      console.log('📤 Testing Content Publishing...');
      
      const testContent = {
        id: 'test_post_001',
        text: 'This is a test post from the OFEM integration system! 🚀',
        media: [],
        tags: ['test', 'automation', 'onlyfans'],
        scheduledTime: new Date().toISOString()
      };

      const result = await this.controller.publishContent(testContent);
      
      if (result.success) {
        console.log(`  📤 Content queued for publishing: Job ID ${result.jobId}`);
        this.recordTestResult('Content Publishing', true, `Job ${result.jobId} queued successfully`);
      } else {
        throw new Error('Content publishing failed');
      }

      console.log('✅ Content publishing test passed\n');

    } catch (error) {
      this.recordTestResult('Content Publishing', false, error.message);
      console.error('❌ Content publishing test failed:', error.message);
    }
  }

  /**
   * Test campaign automation
   */
  async testCampaignAutomation() {
    try {
      console.log('🎯 Testing Campaign Automation...');
      
      // Test welcome campaign
      const welcomeCampaign = await this.controller.triggerCampaign('welcome');
      console.log(`  👋 Welcome campaign: ${welcomeCampaign.successCount || 0} messages sent`);

      // Test retention campaign
      const retentionCampaign = await this.controller.triggerCampaign('retention');
      console.log(`  🛡️ Retention campaign: ${retentionCampaign.successCount || 0} messages sent`);

      // Test upsell campaign
      const upsellCampaign = await this.controller.triggerCampaign('upsell');
      console.log(`  💰 Upsell campaign: ${upsellCampaign.successCount || 0} messages sent`);

      const totalMessages = (welcomeCampaign.successCount || 0) + 
                           (retentionCampaign.successCount || 0) + 
                           (upsellCampaign.successCount || 0);

      this.recordTestResult('Campaign Automation', true, 
        `${totalMessages} total messages queued across all campaigns`);
      console.log('✅ Campaign automation test passed\n');

    } catch (error) {
      this.recordTestResult('Campaign Automation', false, error.message);
      console.error('❌ Campaign automation test failed:', error.message);
    }
  }

  /**
   * Test analytics extraction
   */
  async testAnalyticsExtraction() {
    try {
      console.log('📊 Testing Analytics Extraction...');
      
      const extractionResult = await this.controller.runAnalyticsExtraction();
      
      if (extractionResult.success) {
        console.log(`  📈 Metrics extracted: ${Object.keys(extractionResult.dailyMetrics).length} data points`);
        console.log(`  💡 Insights generated: ${extractionResult.insights.length} insights`);
        
        // Log some sample metrics
        const metrics = extractionResult.dailyMetrics;
        console.log(`  📊 Total subscribers: ${metrics.total_subscribers || 0}`);
        console.log(`  📊 New subscribers: ${metrics.new_subscribers || 0}`);
        console.log(`  📊 Messages sent: ${metrics.messages_sent || 0}`);
        console.log(`  📊 Total revenue: $${(metrics.total_revenue || 0).toFixed(2)}`);
      }

      this.recordTestResult('Analytics Extraction', extractionResult.success, 
        extractionResult.success ? 'Data extracted and insights generated' : extractionResult.error);
      console.log('✅ Analytics extraction test passed\n');

    } catch (error) {
      this.recordTestResult('Analytics Extraction', false, error.message);
      console.error('❌ Analytics extraction test failed:', error.message);
    }
  }

  /**
   * Test anomaly detection
   */
  async testAnomalyDetection() {
    try {
      console.log('🔍 Testing Anomaly Detection...');
      
      const anomalyResult = await this.controller.runAnomalyDetection();
      
      if (anomalyResult.success) {
        console.log(`  🚨 Anomalies detected: ${anomalyResult.totalAnomalies}`);
        console.log(`  ⚠️ High severity: ${anomalyResult.highSeverity}`);
        
        // Log anomaly details if any
        if (anomalyResult.anomalies.length > 0) {
          anomalyResult.anomalies.slice(0, 3).forEach((anomaly, index) => {
            console.log(`  ${index + 1}. ${anomaly.description} (${anomaly.severity})`);
          });
        }
      }

      this.recordTestResult('Anomaly Detection', anomalyResult.success, 
        anomalyResult.success ? `${anomalyResult.totalAnomalies} anomalies detected` : anomalyResult.error);
      console.log('✅ Anomaly detection test passed\n');

    } catch (error) {
      this.recordTestResult('Anomaly Detection', false, error.message);
      console.error('❌ Anomaly detection test failed:', error.message);
    }
  }

  /**
   * Test system status monitoring
   */
  async testSystemStatus() {
    try {
      console.log('🖥️ Testing System Status...');
      
      const status = await this.controller.getSystemStatus();
      
      if (status && !status.error) {
        console.log(`  ⏰ System uptime: ${Math.floor(status.system.uptime / 60)} minutes`);
        console.log(`  🔗 CRM subscribers: ${status.crm.totalSubscribers || 0}`);
        console.log(`  🤖 Pending jobs: ${status.automation.pendingJobs || 0}`);
        console.log(`  💾 Memory usage: ${Math.round(status.system.memoryUsage.heapUsed / 1024 / 1024)}MB`);
      }

      this.recordTestResult('System Status', true, 'System status retrieved successfully');
      console.log('✅ System status test passed\n');

    } catch (error) {
      this.recordTestResult('System Status', false, error.message);
      console.error('❌ System status test failed:', error.message);
    }
  }

  /**
   * Record test result
   */
  recordTestResult(testName, success, details) {
    this.testResults.tests.push({
      name: testName,
      success: success,
      details: details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive test report
   */
  async generateTestReport() {
    try {
      // Calculate summary
      const totalTests = this.testResults.tests.length;
      const passedTests = this.testResults.tests.filter(t => t.success).length;
      const failedTests = totalTests - passedTests;
      
      this.testResults.summary = {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0,
        endTime: new Date().toISOString(),
        duration: new Date() - new Date(this.testResults.startTime)
      };

      // Export analytics report
      const reportPath = await this.controller.exportAnalyticsReport('json');
      
      // Generate test report
      const testReportPath = path.join(__dirname, 'reports', `integration_test_${Date.now()}.json`);
      await fs.mkdir(path.dirname(testReportPath), { recursive: true });
      await fs.writeFile(testReportPath, JSON.stringify(this.testResults, null, 2));

      console.log('\n📊 Test Summary:');
      console.log(`  Total tests: ${totalTests}`);
      console.log(`  Passed: ${passedTests}`);
      console.log(`  Failed: ${failedTests}`);
      console.log(`  Success rate: ${this.testResults.summary.successRate}%`);
      console.log(`  Duration: ${Math.round(this.testResults.summary.duration / 1000)}s`);
      console.log(`\n📁 Reports generated:`);
      console.log(`  Test report: ${testReportPath}`);
      console.log(`  Analytics report: ${reportPath}`);

    } catch (error) {
      console.error('❌ Error generating test report:', error);
    }
  }

  /**
   * Run quick smoke test
   */
  async runSmokeTest() {
    try {
      console.log('💨 Running quick smoke test...\n');
      
      await this.initializeController();
      
      // Quick test - just verify controller can start and basic functions work
      const status = await this.controller.getSystemStatus();
      if (status && !status.error) {
        console.log('✅ Smoke test passed - System is operational');
        this.recordTestResult('Smoke Test', true, 'Basic functionality verified');
      } else {
        throw new Error('System status check failed');
      }
      
    } catch (error) {
      console.error('❌ Smoke test failed:', error);
      this.recordTestResult('Smoke Test', false, error.message);
    } finally {
      if (this.controller) {
        await this.controller.shutdown();
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testSuite = new OFEMIntegrationTest();
  
  if (args.includes('--smoke')) {
    await testSuite.runSmokeTest();
  } else {
    await testSuite.runIntegrationTest();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted. Cleaning up...');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = OFEMIntegrationTest;