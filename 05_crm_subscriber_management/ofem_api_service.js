// ofem_api_service.js
// OnlyFans Enterprise Management API Service
// Integrates CRM functionality with the browser automation service

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs').promises;

class OFEMApiService {
  constructor() {
    // Connect to the automation service database
    this.automationDb = new Database(path.join(__dirname, '../03_scheduling_automation/browser_automation_service/backend/logs.db'));
    
    // Initialize CRM database if it doesn't exist
    this.crmDbPath = path.join(__dirname, 'crm.db');
    this.crmDb = new Database(this.crmDbPath);
    this.initializeCrmDb();
  }

  /**
   * Initialize CRM database tables
   */
  initializeCrmDb() {
    // Subscribers table
    this.crmDb.exec(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        of_user_id TEXT UNIQUE NOT NULL,
        username TEXT,
        email TEXT,
        tier TEXT DEFAULT 'free',
        engagement_level TEXT DEFAULT 'low',
        total_spent REAL DEFAULT 0,
        last_active DATETIME,
        subscription_start DATETIME,
        subscription_end DATETIME,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    this.crmDb.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriber_id INTEGER,
        message_type TEXT,
        template_name TEXT,
        content TEXT,
        status TEXT DEFAULT 'pending',
        job_id INTEGER,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscriber_id) REFERENCES subscribers (id)
      )
    `);

    // Campaigns table
    this.crmDb.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        target_segment TEXT,
        template_name TEXT,
        status TEXT DEFAULT 'draft',
        scheduled_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Add or update a subscriber
   */
  async addSubscriber(subscriberData) {
    try {
      const query = `
        INSERT OR REPLACE INTO subscribers 
        (of_user_id, username, email, tier, engagement_level, total_spent, last_active, subscription_start, subscription_end, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const result = this.crmDb.prepare(query).run(
        subscriberData.of_user_id,
        subscriberData.username,
        subscriberData.email,
        subscriberData.tier || 'free',
        subscriberData.engagement_level || 'low',
        subscriberData.total_spent || 0,
        subscriberData.last_active,
        subscriberData.subscription_start,
        subscriberData.subscription_end,
        subscriberData.status || 'active'
      );

      console.log(`Subscriber ${subscriberData.of_user_id} added/updated successfully`);
      return result.lastInsertRowid || result.changes;
    } catch (error) {
      console.error('Error adding subscriber:', error);
      throw error;
    }
  }

  /**
   * Get subscribers by segment
   */
  getSubscribersBySegment(segment) {
    try {
      let query = 'SELECT * FROM subscribers WHERE status = "active"';
      let params = [];

      switch (segment) {
        case 'high_value':
          query += ' AND total_spent > ? AND engagement_level IN ("high", "medium")';
          params = [100]; // High value threshold
          break;
        case 'at_risk':
          query += ' AND engagement_level = "low" AND last_active < datetime("now", "-7 days")';
          break;
        case 'new_subscribers':
          query += ' AND subscription_start > datetime("now", "-3 days")';
          break;
        case 'tier_premium':
          query += ' AND tier IN ("premium", "vip")';
          break;
        default:
          // Return all active subscribers
          break;
      }

      return this.crmDb.prepare(query).all(...params);
    } catch (error) {
      console.error('Error fetching subscribers by segment:', error);
      return [];
    }
  }

  /**
   * Send personalized message to a subscriber
   */
  async sendPersonalizedMessage(subscriberId, templateName, personalizations = {}) {
    try {
      // Get subscriber data
      const subscriber = this.crmDb.prepare('SELECT * FROM subscribers WHERE id = ?').get(subscriberId);
      if (!subscriber) {
        throw new Error(`Subscriber ${subscriberId} not found`);
      }

      // Load message template
      const template = await this.loadMessageTemplate(templateName);
      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Personalize the message
      let personalizedContent = template.content;
      personalizedContent = personalizedContent.replace('{{username}}', subscriber.username || 'there');
      personalizedContent = personalizedContent.replace('{{tier}}', subscriber.tier);
      
      // Apply custom personalizations
      Object.keys(personalizations).forEach(key => {
        personalizedContent = personalizedContent.replace(`{{${key}}}`, personalizations[key]);
      });

      // Queue the message for sending
      const jobData = {
        type: 'send_dm',
        content: JSON.stringify({
          targetUserId: subscriber.of_user_id,
          message: personalizedContent
        }),
        status: 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert job into automation queue
      const result = this.automationDb.prepare(`
        INSERT INTO jobs (type, folder, content, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        jobData.type,
        `message_${subscriberId}_${Date.now()}`,
        jobData.content,
        jobData.status,
        jobData.created_at,
        jobData.updated_at
      );

      // Record the message in CRM
      this.crmDb.prepare(`
        INSERT INTO messages (subscriber_id, message_type, template_name, content, job_id, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        subscriberId,
        'dm',
        templateName,
        personalizedContent,
        result.lastInsertRowid,
        'queued'
      );

      console.log(`Message queued for subscriber ${subscriber.username} (ID: ${subscriberId})`);
      return {
        success: true,
        jobId: result.lastInsertRowid,
        subscriberId: subscriberId,
        message: 'Message queued successfully'
      };

    } catch (error) {
      console.error('Error sending personalized message:', error);
      throw error;
    }
  }

  /**
   * Load message template from file
   */
  async loadMessageTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, 'message_templates', `${templateName}.md`);
      const content = await fs.readFile(templatePath, 'utf-8');
      
      return {
        name: templateName,
        content: content.trim()
      };
    } catch (error) {
      console.error(`Error loading template ${templateName}:`, error);
      return null;
    }
  }

  /**
   * Run automated campaign
   */
  async runCampaign(campaignId) {
    try {
      const campaign = this.crmDb.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      // Get target subscribers
      const subscribers = this.getSubscribersBySegment(campaign.target_segment);
      console.log(`Running campaign "${campaign.name}" for ${subscribers.length} subscribers`);

      const results = [];
      for (const subscriber of subscribers) {
        try {
          const result = await this.sendPersonalizedMessage(
            subscriber.id,
            campaign.template_name,
            { campaign_name: campaign.name }
          );
          results.push(result);
        } catch (error) {
          console.error(`Failed to send message to subscriber ${subscriber.id}:`, error);
          results.push({
            success: false,
            subscriberId: subscriber.id,
            error: error.message
          });
        }
      }

      // Update campaign status
      this.crmDb.prepare('UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run('running', campaignId);

      return {
        campaignId: campaignId,
        targetCount: subscribers.length,
        results: results,
        successCount: results.filter(r => r.success).length
      };

    } catch (error) {
      console.error('Error running campaign:', error);
      throw error;
    }
  }

  /**
   * Create a new campaign
   */
  createCampaign(campaignData) {
    try {
      const result = this.crmDb.prepare(`
        INSERT INTO campaigns (name, type, target_segment, template_name, status, scheduled_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        campaignData.name,
        campaignData.type,
        campaignData.target_segment,
        campaignData.template_name,
        campaignData.status || 'draft',
        campaignData.scheduled_at
      );

      console.log(`Campaign "${campaignData.name}" created with ID: ${result.lastInsertRowid}`);
      return result.lastInsertRowid;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics() {
    try {
      const stats = {
        totalSubscribers: this.crmDb.prepare('SELECT COUNT(*) as count FROM subscribers WHERE status = "active"').get().count,
        tierBreakdown: this.crmDb.prepare('SELECT tier, COUNT(*) as count FROM subscribers WHERE status = "active" GROUP BY tier').all(),
        engagementBreakdown: this.crmDb.prepare('SELECT engagement_level, COUNT(*) as count FROM subscribers WHERE status = "active" GROUP BY engagement_level').all(),
        recentMessages: this.crmDb.prepare('SELECT COUNT(*) as count FROM messages WHERE created_at > datetime("now", "-24 hours")').get().count,
        totalRevenue: this.crmDb.prepare('SELECT SUM(total_spent) as total FROM subscribers WHERE status = "active"').get().total || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {};
    }
  }

  /**
   * Close database connections
   */
  close() {
    this.automationDb.close();
    this.crmDb.close();
  }
}

module.exports = OFEMApiService;