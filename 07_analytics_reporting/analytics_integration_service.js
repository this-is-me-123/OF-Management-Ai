// analytics_integration_service.js
// OnlyFans Analytics Integration Service
// Connects OnlyFans data sources with the analytics and reporting pipeline

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;
const { execSync } = require('child_process');

class AnalyticsIntegrationService {
  constructor() {
    // Connect to various data sources
    this.crmDb = new Database(path.join(__dirname, '../05_crm_subscriber_management/crm.db'));
    this.automationDb = new Database(path.join(__dirname, '../03_scheduling_automation/browser_automation_service/backend/logs.db'));
    
    // Initialize analytics database
    this.analyticsDbPath = path.join(__dirname, 'analytics.db');
    this.analyticsDb = new Database(this.analyticsDbPath);
    this.initializeAnalyticsDb();
  }

  /**
   * Initialize analytics database tables
   */
  initializeAnalyticsDb() {
    // Daily metrics table
    this.analyticsDb.exec(`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        total_subscribers INTEGER DEFAULT 0,
        new_subscribers INTEGER DEFAULT 0,
        churned_subscribers INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        messages_sent INTEGER DEFAULT 0,
        posts_published INTEGER DEFAULT 0,
        engagement_rate REAL DEFAULT 0,
        conversion_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Performance metrics table
    this.analyticsDb.exec(`
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metric_type TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    // Content performance table
    this.analyticsDb.exec(`
      CREATE TABLE IF NOT EXISTS content_performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        content_type TEXT,
        platform TEXT,
        engagement_score REAL DEFAULT 0,
        reach INTEGER DEFAULT 0,
        conversion_count INTEGER DEFAULT 0,
        revenue_generated REAL DEFAULT 0,
        posted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Anomalies table
    this.analyticsDb.exec(`
      CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        expected_value REAL,
        actual_value REAL,
        deviation_percentage REAL,
        severity TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'new',
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        description TEXT
      )
    `);
  }

  /**
   * Extract and transform OnlyFans data
   */
  async extractOnlyFansData() {
    try {
      console.log('🔄 Starting OnlyFans data extraction...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Extract subscriber metrics
      const subscriberMetrics = this.extractSubscriberMetrics(today);
      
      // Extract messaging metrics
      const messagingMetrics = this.extractMessagingMetrics(today);
      
      // Extract posting metrics
      const postingMetrics = this.extractPostingMetrics(today);
      
      // Combine all metrics
      const dailyMetrics = {
        date: today,
        ...subscriberMetrics,
        ...messagingMetrics,
        ...postingMetrics
      };

      // Store in analytics database
      await this.storeDailyMetrics(dailyMetrics);
      
      console.log('✅ OnlyFans data extraction completed');
      return dailyMetrics;
      
    } catch (error) {
      console.error('Error extracting OnlyFans data:', error);
      throw error;
    }
  }

  /**
   * Extract subscriber metrics
   */
  extractSubscriberMetrics(date) {
    try {
      const total = this.crmDb.prepare('SELECT COUNT(*) as count FROM subscribers WHERE status = "active"').get().count;
      
      const newToday = this.crmDb.prepare(`
        SELECT COUNT(*) as count FROM subscribers 
        WHERE DATE(subscription_start) = ? AND status = "active"
      `).get(date).count;
      
      const churned = this.crmDb.prepare(`
        SELECT COUNT(*) as count FROM subscribers 
        WHERE DATE(subscription_end) = ? OR (status = "inactive" AND DATE(updated_at) = ?)
      `).get(date, date).count;
      
      const revenue = this.crmDb.prepare(`
        SELECT SUM(total_spent) as total FROM subscribers WHERE status = "active"
      `).get().total || 0;

      return {
        total_subscribers: total,
        new_subscribers: newToday,
        churned_subscribers: churned,
        total_revenue: revenue
      };
    } catch (error) {
      console.error('Error extracting subscriber metrics:', error);
      return {};
    }
  }

  /**
   * Extract messaging metrics
   */
  extractMessagingMetrics(date) {
    try {
      const messagesSent = this.crmDb.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE DATE(created_at) = ? AND status = "completed"
      `).get(date).count;

      // Calculate conversion rate from messages
      const conversions = this.crmDb.prepare(`
        SELECT COUNT(*) as count FROM subscribers s
        INNER JOIN messages m ON s.id = m.subscriber_id
        WHERE DATE(m.created_at) = ? AND s.total_spent > 0
      `).get(date).count;

      const conversionRate = messagesSent > 0 ? (conversions / messagesSent) * 100 : 0;

      return {
        messages_sent: messagesSent,
        conversion_rate: conversionRate
      };
    } catch (error) {
      console.error('Error extracting messaging metrics:', error);
      return {};
    }
  }

  /**
   * Extract posting metrics
   */
  extractPostingMetrics(date) {
    try {
      const postsPublished = this.automationDb.prepare(`
        SELECT COUNT(*) as count FROM jobs 
        WHERE type = "post_content" AND DATE(created_at) = ? AND status = "completed"
      `).get(date).count;

      // Estimate engagement rate (placeholder for now)
      const engagementRate = Math.random() * 10 + 2; // TODO: Replace with actual OnlyFans engagement data

      return {
        posts_published: postsPublished,
        engagement_rate: engagementRate
      };
    } catch (error) {
      console.error('Error extracting posting metrics:', error);
      return {};
    }
  }

  /**
   * Store daily metrics
   */
  async storeDailyMetrics(metrics) {
    try {
      const query = `
        INSERT OR REPLACE INTO daily_metrics 
        (date, total_subscribers, new_subscribers, churned_subscribers, total_revenue, 
         messages_sent, posts_published, engagement_rate, conversion_rate, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      this.analyticsDb.prepare(query).run(
        metrics.date,
        metrics.total_subscribers || 0,
        metrics.new_subscribers || 0,
        metrics.churned_subscribers || 0,
        metrics.total_revenue || 0,
        metrics.messages_sent || 0,
        metrics.posts_published || 0,
        metrics.engagement_rate || 0,
        metrics.conversion_rate || 0
      );

      console.log(`📊 Daily metrics stored for ${metrics.date}`);
    } catch (error) {
      console.error('Error storing daily metrics:', error);
      throw error;
    }
  }

  /**
   * Run anomaly detection
   */
  async detectAnomalies() {
    try {
      console.log('🔍 Running anomaly detection...');
      
      // Get recent metrics for analysis
      const recentMetrics = this.analyticsDb.prepare(`
        SELECT * FROM daily_metrics 
        ORDER BY date DESC 
        LIMIT 30
      `).all();

      if (recentMetrics.length < 7) {
        console.log('⚠️ Not enough data for anomaly detection');
        return [];
      }

      const anomalies = [];
      
      // Check subscriber growth anomalies
      const avgNewSubscribers = recentMetrics.slice(1, 8).reduce((sum, m) => sum + m.new_subscribers, 0) / 7;
      const todayNew = recentMetrics[0].new_subscribers;
      
      if (Math.abs(todayNew - avgNewSubscribers) > avgNewSubscribers * 0.5) {
        anomalies.push({
          metric_name: 'new_subscribers',
          expected_value: avgNewSubscribers,
          actual_value: todayNew,
          deviation_percentage: ((todayNew - avgNewSubscribers) / avgNewSubscribers) * 100,
          severity: Math.abs(todayNew - avgNewSubscribers) > avgNewSubscribers ? 'high' : 'medium',
          description: `New subscriber count (${todayNew}) deviates significantly from 7-day average (${avgNewSubscribers.toFixed(1)})`
        });
      }

      // Check revenue anomalies
      const avgRevenue = recentMetrics.slice(1, 8).reduce((sum, m) => sum + m.total_revenue, 0) / 7;
      const todayRevenue = recentMetrics[0].total_revenue;
      
      if (avgRevenue > 0 && Math.abs(todayRevenue - avgRevenue) > avgRevenue * 0.3) {
        anomalies.push({
          metric_name: 'total_revenue',
          expected_value: avgRevenue,
          actual_value: todayRevenue,
          deviation_percentage: ((todayRevenue - avgRevenue) / avgRevenue) * 100,
          severity: todayRevenue < avgRevenue * 0.7 ? 'high' : 'medium',
          description: `Revenue (${todayRevenue.toFixed(2)}) deviates significantly from 7-day average (${avgRevenue.toFixed(2)})`
        });
      }

      // Store anomalies
      for (const anomaly of anomalies) {
        this.analyticsDb.prepare(`
          INSERT INTO anomalies (metric_name, expected_value, actual_value, deviation_percentage, severity, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          anomaly.metric_name,
          anomaly.expected_value,
          anomaly.actual_value,
          anomaly.deviation_percentage,
          anomaly.severity,
          anomaly.description
        );
      }

      console.log(`🚨 Detected ${anomalies.length} anomalies`);
      return anomalies;
      
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Generate insights and recommendations
   */
  async generateInsights() {
    try {
      console.log('💡 Generating insights...');
      
      const insights = [];
      
      // Get recent performance data
      const last30Days = this.analyticsDb.prepare(`
        SELECT * FROM daily_metrics 
        WHERE date >= date('now', '-30 days')
        ORDER BY date DESC
      `).all();

      if (last30Days.length === 0) {
        return insights;
      }

      // Trend analysis
      const recentWeek = last30Days.slice(0, 7);
      const previousWeek = last30Days.slice(7, 14);
      
      if (recentWeek.length >= 7 && previousWeek.length >= 7) {
        const recentAvgNew = recentWeek.reduce((sum, m) => sum + m.new_subscribers, 0) / 7;
        const previousAvgNew = previousWeek.reduce((sum, m) => sum + m.new_subscribers, 0) / 7;
        
        if (recentAvgNew > previousAvgNew * 1.1) {
          insights.push({
            type: 'positive_trend',
            metric: 'subscriber_growth',
            message: `Subscriber growth is up ${((recentAvgNew / previousAvgNew - 1) * 100).toFixed(1)}% compared to last week`,
            recommendation: 'Continue current content strategy and consider scaling successful campaigns'
          });
        } else if (recentAvgNew < previousAvgNew * 0.9) {
          insights.push({
            type: 'negative_trend',
            metric: 'subscriber_growth',
            message: `Subscriber growth is down ${((1 - recentAvgNew / previousAvgNew) * 100).toFixed(1)}% compared to last week`,
            recommendation: 'Review content strategy and consider running retention campaigns'
          });
        }
      }

      // Conversion rate analysis
      const avgConversionRate = last30Days.reduce((sum, m) => sum + m.conversion_rate, 0) / last30Days.length;
      if (avgConversionRate < 5) {
        insights.push({
          type: 'optimization_opportunity',
          metric: 'conversion_rate',
          message: `Current conversion rate (${avgConversionRate.toFixed(2)}%) is below optimal range`,
          recommendation: 'Review message templates and personalization strategies to improve conversion'
        });
      }

      console.log(`💭 Generated ${insights.length} insights`);
      return insights;
      
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Export data for external analytics tools
   */
  async exportAnalyticsData(format = 'csv') {
    try {
      const data = this.analyticsDb.prepare(`
        SELECT * FROM daily_metrics 
        ORDER BY date DESC 
        LIMIT 90
      `).all();

      const exportPath = path.join(__dirname, 'data', `analytics_export_${Date.now()}.${format}`);
      
      if (format === 'csv') {
        const csvContent = [
          Object.keys(data[0]).join(','),
          ...data.map(row => Object.values(row).join(','))
        ].join('\n');
        
        await fs.writeFile(exportPath, csvContent);
      } else if (format === 'json') {
        await fs.writeFile(exportPath, JSON.stringify(data, null, 2));
      }

      console.log(`📤 Analytics data exported to: ${exportPath}`);
      return exportPath;
      
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  getDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Current metrics
      const currentMetrics = this.analyticsDb.prepare(`
        SELECT * FROM daily_metrics WHERE date = ?
      `).get(today) || {};

      // Historical trends (last 30 days)
      const trends = this.analyticsDb.prepare(`
        SELECT date, total_subscribers, new_subscribers, total_revenue, conversion_rate
        FROM daily_metrics 
        WHERE date >= date('now', '-30 days')
        ORDER BY date ASC
      `).all();

      // Recent anomalies
      const anomalies = this.analyticsDb.prepare(`
        SELECT * FROM anomalies 
        WHERE status = 'new' 
        ORDER BY detected_at DESC 
        LIMIT 10
      `).all();

      // Performance summary
      const summary = {
        totalSubscribers: currentMetrics.total_subscribers || 0,
        monthlyRevenue: trends.reduce((sum, day) => sum + (day.total_revenue || 0), 0),
        avgConversionRate: trends.length > 0 ? 
          trends.reduce((sum, day) => sum + (day.conversion_rate || 0), 0) / trends.length : 0,
        totalAnomalies: anomalies.length
      };

      return {
        current: currentMetrics,
        trends: trends,
        anomalies: anomalies,
        summary: summary
      };
      
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return {};
    }
  }

  /**
   * Close database connections
   */
  close() {
    this.crmDb.close();
    this.automationDb.close();
    this.analyticsDb.close();
  }
}

module.exports = AnalyticsIntegrationService;