/**
 * crm_automation.js
 *
 * Complete CRM automation system for subscriber management
 */
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

class CRMAutomation {
  constructor() {
    this.dbPath = path.join(__dirname, '../../crm.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeTables();
    this.loadTemplates();
    this.loadSegmentationRules();
  }

  initializeTables() {
    // Initialize CRM tables
    this.db.run(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        tier TEXT DEFAULT 'Bronze',
        total_spent REAL DEFAULT 0,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS crm_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriber_id INTEGER,
        message_type TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        FOREIGN KEY (subscriber_id) REFERENCES subscribers (id)
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriber_id INTEGER,
        automation_type TEXT,
        triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        result TEXT,
        FOREIGN KEY (subscriber_id) REFERENCES subscribers (id)
      )
    `);

    console.log('✅ CRM database tables initialized');
  }

  loadTemplates() {
    this.templates = {};
    const templatesDir = path.join(__dirname, 'message_templates');
    
    try {
      // Load welcome template
      this.templates.welcome = fs.readFileSync(
        path.join(templatesDir, 'tier1_welcome.md'), 
        'utf8'
      );
      
      // Load retention template
      this.templates.retention = fs.readFileSync(
        path.join(templatesDir, 'retention_offer.md'), 
        'utf8'
      );
      
      // Load churn warning template
      this.templates.churn_warning = fs.readFileSync(
        path.join(templatesDir, 'churn_warning_followup.txt'), 
        'utf8'
      );
      
      console.log('✅ Message templates loaded');
    } catch (error) {
      console.error('Error loading templates:', error.message);
    }
  }

  loadSegmentationRules() {
    try {
      const rulesPath = path.join(__dirname, 'segmentation_rules.json');
      this.segmentationRules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
      console.log('✅ Segmentation rules loaded');
    } catch (error) {
      console.error('Error loading segmentation rules:', error.message);
    }
  }

  // Onboarding automation
  async processNewSubscribers() {
    const newSubscribers = await this.getNewSubscribers();
    
    for (const subscriber of newSubscribers) {
      try {
        await this.sendWelcomeMessage(subscriber);
        await this.logAutomation(subscriber.id, 'onboarding', 'success');
        console.log(`✅ Welcome message sent to ${subscriber.username}`);
      } catch (error) {
        await this.logAutomation(subscriber.id, 'onboarding', `error: ${error.message}`);
        console.error(`❌ Failed to send welcome to ${subscriber.username}:`, error.message);
      }
    }
  }

  // Retention automation
  async processRetentionCampaign() {
    const atRiskSubscribers = await this.getAtRiskSubscribers();
    
    for (const subscriber of atRiskSubscribers) {
      try {
        await this.sendRetentionMessage(subscriber);
        await this.logAutomation(subscriber.id, 'retention', 'success');
        console.log(`✅ Retention message sent to ${subscriber.username}`);
      } catch (error) {
        await this.logAutomation(subscriber.id, 'retention', `error: ${error.message}`);
        console.error(`❌ Failed to send retention to ${subscriber.username}:`, error.message);
      }
    }
  }

  // Churn prevention automation
  async processChurnPrevention() {
    const churnRiskSubscribers = await this.getChurnRiskSubscribers();
    
    for (const subscriber of churnRiskSubscribers) {
      try {
        await this.sendChurnPreventionMessage(subscriber);
        await this.logAutomation(subscriber.id, 'churn_prevention', 'success');
        console.log(`✅ Churn prevention message sent to ${subscriber.username}`);
      } catch (error) {
        await this.logAutomation(subscriber.id, 'churn_prevention', `error: ${error.message}`);
        console.error(`❌ Failed to send churn prevention to ${subscriber.username}:`, error.message);
      }
    }
  }

  // Database queries
  async getNewSubscribers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM subscribers 
        WHERE subscription_date >= datetime('now', '-24 hours')
        AND id NOT IN (
          SELECT subscriber_id FROM crm_messages 
          WHERE message_type = 'welcome'
        )
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getAtRiskSubscribers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM subscribers 
        WHERE last_activity < datetime('now', '-14 days')
        AND status = 'active'
        AND id NOT IN (
          SELECT subscriber_id FROM crm_messages 
          WHERE message_type = 'retention' 
          AND sent_at >= datetime('now', '-7 days')
        )
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getChurnRiskSubscribers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM subscribers 
        WHERE last_activity < datetime('now', '-30 days')
        AND status = 'active'
        AND id NOT IN (
          SELECT subscriber_id FROM crm_messages 
          WHERE message_type = 'churn_prevention' 
          AND sent_at >= datetime('now', '-14 days')
        )
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Message sending functions
  async sendWelcomeMessage(subscriber) {
    const content = this.personalizeTemplate(this.templates.welcome, subscriber);
    
    return this.sendMessage(subscriber.id, {
      type: 'welcome',
      subject: `Welcome to the Inner Circle, ${subscriber.username}!`,
      content: content
    });
  }

  async sendRetentionMessage(subscriber) {
    const content = this.personalizeTemplate(this.templates.retention, subscriber);
    
    return this.sendMessage(subscriber.id, {
      type: 'retention',
      subject: `We miss you, ${subscriber.username}! Special offer inside 💎`,
      content: content
    });
  }

  async sendChurnPreventionMessage(subscriber) {
    const content = this.personalizeTemplate(this.templates.churn_warning, subscriber);
    
    return this.sendMessage(subscriber.id, {
      type: 'churn_prevention',
      subject: `Don't go, ${subscriber.username}! One last chance...`,
      content: content
    });
  }

  async sendMessage(subscriberId, messageData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO crm_messages (subscriber_id, message_type, subject, content)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        subscriberId, 
        messageData.type, 
        messageData.subject, 
        messageData.content
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  personalizeTemplate(template, subscriber) {
    return template
      .replace(/\{\{subscriber_name\}\}/g, subscriber.username)
      .replace(/\{\{tier\}\}/g, subscriber.tier)
      .replace(/\{\{total_spent\}\}/g, subscriber.total_spent || 0);
  }

  async logAutomation(subscriberId, type, result) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO automation_logs (subscriber_id, automation_type, result)
        VALUES (?, ?, ?)
      `;
      
      this.db.run(query, [subscriberId, type, result], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Start automation schedules
  startAutomation() {
    console.log('🤖 Starting CRM automation schedules...');
    
    // Run onboarding every hour
    cron.schedule('0 * * * *', () => {
      console.log('Running onboarding automation...');
      this.processNewSubscribers();
    });
    
    // Run retention daily at 10 AM
    cron.schedule('0 10 * * *', () => {
      console.log('Running retention campaign...');
      this.processRetentionCampaign();
    });
    
    // Run churn prevention every other day at 2 PM
    cron.schedule('0 14 */2 * *', () => {
      console.log('Running churn prevention...');
      this.processChurnPrevention();
    });
    
    console.log('✅ CRM automation started successfully');
  }

  // API methods for manual triggers
  async addSubscriber(userData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO subscribers (username, email, tier, total_spent)
        VALUES (?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        userData.username,
        userData.email || null,
        userData.tier || 'Bronze',
        userData.totalSpent || 0
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async updateSubscriberActivity(username) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE subscribers 
        SET last_activity = datetime('now')
        WHERE username = ?
      `;
      
      this.db.run(query, [username], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async getSubscriberStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN last_activity < datetime('now', '-14 days') THEN 1 END) as at_risk,
          COUNT(CASE WHEN last_activity < datetime('now', '-30 days') THEN 1 END) as churn_risk,
          AVG(total_spent) as avg_spent
        FROM subscribers
      `;
      
      this.db.get(query, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = CRMAutomation;