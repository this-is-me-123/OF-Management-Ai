/**
 * analytics_dashboard.js
 *
 * Comprehensive analytics dashboard for OFEM system
 */
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

class AnalyticsDashboard {
  constructor() {
    this.dbPath = path.join(__dirname, '../crm.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeAnalyticsTables();
  }

  initializeAnalyticsTables() {
    // Create analytics tables if they don't exist
    this.db.run(`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        new_subscribers INTEGER DEFAULT 0,
        total_subscribers INTEGER DEFAULT 0,
        churned_subscribers INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        avg_session_duration REAL DEFAULT 0,
        engagement_rate REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS revenue_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriber_id INTEGER,
        event_type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscriber_id) REFERENCES subscribers (id)
      )
    `);

    console.log('✅ Analytics tables initialized');
  }

  // Core KPI calculations
  async getSubscriberGrowth(days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          DATE(subscription_date) as date,
          COUNT(*) as new_subscribers
        FROM subscribers 
        WHERE subscription_date >= date('now', '-${days} days')
        GROUP BY DATE(subscription_date)
        ORDER BY date ASC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getChurnRate(days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(CASE WHEN status = 'churned' THEN 1 END) as churned,
          COUNT(*) as total,
          ROUND(
            (COUNT(CASE WHEN status = 'churned' THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as churn_rate
        FROM subscribers
        WHERE subscription_date >= date('now', '-${days} days')
      `;
      
      this.db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || { churned: 0, total: 0, churn_rate: 0 });
      });
    });
  }

  async getARPU() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_subscribers,
          SUM(total_spent) as total_revenue,
          ROUND(SUM(total_spent) / COUNT(*), 2) as arpu
        FROM subscribers
        WHERE status = 'active'
      `;
      
      this.db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || { total_subscribers: 0, total_revenue: 0, arpu: 0 });
      });
    });
  }

  async getEngagementMetrics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_subscribers,
          COUNT(CASE WHEN last_activity >= date('now', '-7 days') THEN 1 END) as active_weekly,
          COUNT(CASE WHEN last_activity >= date('now', '-30 days') THEN 1 END) as active_monthly,
          ROUND(
            (COUNT(CASE WHEN last_activity >= date('now', '-7 days') THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as weekly_engagement_rate,
          ROUND(
            (COUNT(CASE WHEN last_activity >= date('now', '-30 days') THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as monthly_engagement_rate
        FROM subscribers
        WHERE status = 'active'
      `;
      
      this.db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row || {
          total_subscribers: 0,
          active_weekly: 0,
          active_monthly: 0,
          weekly_engagement_rate: 0,
          monthly_engagement_rate: 0
        });
      });
    });
  }

  async getTierDistribution() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          tier,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM subscribers WHERE status = 'active'), 2) as percentage,
          ROUND(AVG(total_spent), 2) as avg_spent
        FROM subscribers
        WHERE status = 'active'
        GROUP BY tier
        ORDER BY count DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getRevenueAnalytics(days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          DATE(created_at) as date,
          SUM(amount) as daily_revenue,
          COUNT(*) as transactions
        FROM revenue_events
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getCRMPerformance() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          message_type,
          COUNT(*) as messages_sent,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          ROUND(
            (COUNT(CASE WHEN status = 'delivered' THEN 1 END) * 100.0 / COUNT(*)), 2
          ) as delivery_rate
        FROM crm_messages
        WHERE sent_at >= date('now', '-30 days')
        GROUP BY message_type
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getTopPerformingContent() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          content,
          caption,
          platform,
          published_at,
          'scheduled_posts' as source
        FROM scheduled_posts
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT 10
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getDashboardSummary() {
    try {
      const [
        subscriberGrowth,
        churnRate,
        arpu,
        engagement,
        tierDistribution,
        revenueAnalytics,
        crmPerformance
      ] = await Promise.all([
        this.getSubscriberGrowth(30),
        this.getChurnRate(30),
        this.getARPU(),
        this.getEngagementMetrics(),
        this.getTierDistribution(),
        this.getRevenueAnalytics(30),
        this.getCRMPerformance()
      ]);

      return {
        overview: {
          subscriber_growth: subscriberGrowth,
          churn_rate: churnRate,
          arpu: arpu,
          engagement: engagement
        },
        segments: {
          tier_distribution: tierDistribution
        },
        revenue: {
          daily_revenue: revenueAnalytics
        },
        crm: {
          performance: crmPerformance
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Anomaly detection using simple statistical methods
  async detectAnomalies() {
    try {
      const metrics = await this.getSubscriberGrowth(60);
      
      if (metrics.length < 7) {
        return { anomalies: [], message: 'Insufficient data for anomaly detection' };
      }

      const values = metrics.map(m => m.new_subscribers);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const anomalies = metrics.filter(metric => {
        const zScore = Math.abs(metric.new_subscribers - mean) / stdDev;
        return zScore > 2; // Flag values more than 2 standard deviations from mean
      });

      return {
        anomalies: anomalies.map(a => ({
          ...a,
          severity: Math.abs(a.new_subscribers - mean) / stdDev > 3 ? 'high' : 'medium'
        })),
        baseline: { mean: Math.round(mean), stdDev: Math.round(stdDev) }
      };
    } catch (error) {
      throw error;
    }
  }

  // Prediction models (simple linear regression for demo)
  async predictChurnRisk() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          username,
          tier,
          total_spent,
          julianday('now') - julianday(last_activity) as days_inactive,
          julianday('now') - julianday(subscription_date) as subscription_age
        FROM subscribers
        WHERE status = 'active'
        ORDER BY days_inactive DESC
        LIMIT 20
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else {
          // Simple churn risk scoring
          const predictions = rows.map(subscriber => {
            let risk_score = 0;
            
            // Inactivity factor
            if (subscriber.days_inactive > 30) risk_score += 0.4;
            else if (subscriber.days_inactive > 14) risk_score += 0.2;
            
            // Spending factor
            if (subscriber.total_spent < 50) risk_score += 0.3;
            
            // Subscription age factor
            if (subscriber.subscription_age < 30) risk_score += 0.2;
            
            return {
              ...subscriber,
              churn_risk_score: Math.min(risk_score, 1.0),
              risk_level: risk_score > 0.7 ? 'high' : risk_score > 0.4 ? 'medium' : 'low'
            };
          });
          
          resolve(predictions);
        }
      });
    });
  }
}

// Express server setup
const app = express();
const PORT = process.env.ANALYTICS_PORT || 3003;
const dashboard = new AnalyticsDashboard();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/dashboard', async (req, res) => {
  try {
    const summary = await dashboard.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ error: 'Failed to generate dashboard' });
  }
});

app.get('/api/anomalies', async (req, res) => {
  try {
    const anomalies = await dashboard.detectAnomalies();
    res.json(anomalies);
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

app.get('/api/churn-predictions', async (req, res) => {
  try {
    const predictions = await dashboard.predictChurnRisk();
    res.json(predictions);
  } catch (error) {
    console.error('Error predicting churn:', error);
    res.status(500).json({ error: 'Failed to predict churn risk' });
  }
});

app.get('/api/kpis', async (req, res) => {
  try {
    const [arpu, engagement, churnRate] = await Promise.all([
      dashboard.getARPU(),
      dashboard.getEngagementMetrics(),
      dashboard.getChurnRate()
    ]);
    
    res.json({
      arpu: arpu.arpu,
      engagement_rate: engagement.weekly_engagement_rate,
      churn_rate: churnRate.churn_rate,
      total_subscribers: engagement.total_subscribers,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`📊 Analytics dashboard running on port ${PORT}`);
  console.log(`🔗 Dashboard: http://localhost:${PORT}/api/dashboard`);
});

module.exports = { AnalyticsDashboard, app };