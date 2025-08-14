/**
 * revenue_optimization_service.js
 *
 * Comprehensive revenue optimization service for OFEM
 * Includes A/B testing, AI upsell generation, and pricing strategies
 */
const OpenAI = require('openai');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

class RevenueOptimizationService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.dbPath = path.join(__dirname, '../crm.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeTables();
    this.loadPricingStrategies();
  }

  initializeTables() {
    // A/B testing tables
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ab_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name TEXT NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        status TEXT DEFAULT 'active',
        target_metric TEXT NOT NULL,
        control_group_size INTEGER DEFAULT 0,
        variant_group_size INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS ab_test_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER,
        variant_name TEXT NOT NULL,
        variant_type TEXT NOT NULL,
        configuration TEXT,
        conversion_rate REAL DEFAULT 0,
        revenue_per_user REAL DEFAULT 0,
        sample_size INTEGER DEFAULT 0,
        FOREIGN KEY (test_id) REFERENCES ab_tests (id)
      )
    `);

    // Upsell campaigns
    this.db.run(`
      CREATE TABLE IF NOT EXISTS upsell_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_name TEXT NOT NULL,
        target_segment TEXT,
        message_template TEXT,
        pricing_strategy TEXT,
        success_rate REAL DEFAULT 0,
        revenue_generated REAL DEFAULT 0,
        messages_sent INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Revenue events tracking
    this.db.run(`
      CREATE TABLE IF NOT EXISTS revenue_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subscriber_id INTEGER,
        event_type TEXT NOT NULL,
        amount REAL NOT NULL,
        tier_before TEXT,
        tier_after TEXT,
        campaign_id INTEGER,
        ab_test_id INTEGER,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscriber_id) REFERENCES subscribers (id),
        FOREIGN KEY (campaign_id) REFERENCES upsell_campaigns (id),
        FOREIGN KEY (ab_test_id) REFERENCES ab_tests (id)
      )
    `);

    console.log('✅ Revenue optimization tables initialized');
  }

  loadPricingStrategies() {
    this.pricingStrategies = {
      tier_upgrade: {
        bronze_to_silver: { base_price: 25, discount_range: [10, 30] },
        silver_to_gold: { base_price: 50, discount_range: [15, 35] },
        gold_to_platinum: { base_price: 100, discount_range: [20, 40] }
      },
      ppv_offers: {
        photo_set: { base_price: 15, premium_multiplier: 1.5 },
        video_content: { base_price: 30, premium_multiplier: 2.0 },
        custom_content: { base_price: 75, premium_multiplier: 2.5 }
      },
      bundle_deals: {
        weekly_special: { discount: 25, min_items: 3 },
        monthly_vip: { discount: 40, min_spend: 100 },
        loyalty_bonus: { discount: 20, min_subscription_days: 30 }
      }
    };
  }

  // A/B Testing Framework
  async createABTest(testConfig) {
    const { test_name, description, target_metric, variants } = testConfig;
    
    try {
      return new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO ab_tests (test_name, description, start_date, target_metric)
          VALUES (?, ?, date('now'), ?)
        `, [test_name, description, target_metric], function(err) {
          if (err) reject(err);
          else {
            const testId = this.lastID;
            
            // Create variants
            const variantPromises = variants.map(variant => {
              return new Promise((res, rej) => {
                this.db.run(`
                  INSERT INTO ab_test_variants (test_id, variant_name, variant_type, configuration)
                  VALUES (?, ?, ?, ?)
                `, [testId, variant.name, variant.type, JSON.stringify(variant.config)], function(err) {
                  if (err) rej(err);
                  else res(this.lastID);
                });
              });
            });

            Promise.all(variantPromises)
              .then(() => {
                console.log(`✅ A/B test created: ${test_name} (ID: ${testId})`);
                resolve({ testId, test_name, variants: variants.length });
              })
              .catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async assignUserToTestVariant(testId, subscriberId) {
    // Simple random assignment (50/50 split for binary tests)
    const variants = await this.getTestVariants(testId);
    const selectedVariant = variants[Math.floor(Math.random() * variants.length)];
    
    // Log assignment (could be stored in separate table)
    console.log(`👤 User ${subscriberId} assigned to variant: ${selectedVariant.variant_name}`);
    return selectedVariant;
  }

  async getTestVariants(testId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM ab_test_variants WHERE test_id = ?
      `, [testId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async recordConversion(testId, variantId, subscriberId, revenue = 0) {
    try {
      // Record revenue event
      await this.recordRevenueEvent({
        subscriber_id: subscriberId,
        event_type: 'ab_test_conversion',
        amount: revenue,
        ab_test_id: testId,
        description: `Conversion for variant ${variantId}`
      });

      // Update variant stats
      this.db.run(`
        UPDATE ab_test_variants 
        SET sample_size = sample_size + 1,
            revenue_per_user = (revenue_per_user * (sample_size - 1) + ?) / sample_size,
            conversion_rate = (SELECT COUNT(*) FROM revenue_events 
                             WHERE ab_test_id = ? AND event_type = 'ab_test_conversion') 
                           / CAST(sample_size AS REAL) * 100
        WHERE id = ?
      `, [revenue, testId, variantId]);

      console.log(`✅ Conversion recorded for test ${testId}, variant ${variantId}`);
    } catch (error) {
      console.error('Error recording conversion:', error);
    }
  }

  // AI Upsell Generation
  async generateUpsellMessage(context) {
    const {
      subscriber_tier,
      target_tier,
      spending_history,
      engagement_level,
      campaign_type = 'tier_upgrade',
      personalization_data = {}
    } = context;

    try {
      const prompt = this.buildUpsellPrompt(context);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in revenue optimization for OnlyFans creators. Create personalized, compelling upsell messages that feel authentic and not pushy. Focus on value and exclusivity while maintaining a warm, personal tone."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const message = response.choices[0].message.content.trim();
      const pricing = this.calculateOptimalPricing(context);

      return {
        success: true,
        message,
        pricing,
        context,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating upsell message:', error);
      return { success: false, error: error.message };
    }
  }

  buildUpsellPrompt(context) {
    const { subscriber_tier, target_tier, spending_history, engagement_level, campaign_type } = context;
    
    return `Create a personalized upsell message for an OnlyFans subscriber with the following profile:

Current tier: ${subscriber_tier}
Target upgrade: ${target_tier}
Spending history: $${spending_history || 0} total
Engagement level: ${engagement_level}
Campaign type: ${campaign_type}

Requirements:
- Personal and authentic tone
- Highlight exclusive benefits of upgrading
- Include a sense of urgency or limited-time offer
- Maximum 150 words
- Include relevant emojis
- End with a clear call-to-action

Message:`;
  }

  calculateOptimalPricing(context) {
    const { subscriber_tier, target_tier, spending_history, campaign_type } = context;
    
    let basePrice = 25;
    let discountPercent = 15;

    // Determine base pricing
    if (campaign_type === 'tier_upgrade') {
      const upgrade = this.pricingStrategies.tier_upgrade[`${subscriber_tier}_to_${target_tier}`];
      if (upgrade) {
        basePrice = upgrade.base_price;
        const [minDiscount, maxDiscount] = upgrade.discount_range;
        
        // Adjust discount based on spending history
        if (spending_history > 100) discountPercent = maxDiscount;
        else if (spending_history > 50) discountPercent = (minDiscount + maxDiscount) / 2;
        else discountPercent = minDiscount;
      }
    }

    const discountedPrice = basePrice * (1 - discountPercent / 100);
    
    return {
      base_price: basePrice,
      discount_percent: discountPercent,
      final_price: Math.round(discountedPrice * 100) / 100,
      savings: Math.round((basePrice - discountedPrice) * 100) / 100
    };
  }

  // Upsell Campaign Management
  async createUpsellCampaign(campaignConfig) {
    const {
      campaign_name,
      target_segment,
      pricing_strategy,
      message_template,
      auto_send = false
    } = campaignConfig;

    try {
      return new Promise((resolve, reject) => {
        this.db.run(`
          INSERT INTO upsell_campaigns (campaign_name, target_segment, message_template, pricing_strategy)
          VALUES (?, ?, ?, ?)
        `, [campaign_name, target_segment, message_template, pricing_strategy], function(err) {
          if (err) reject(err);
          else {
            const campaignId = this.lastID;
            console.log(`✅ Upsell campaign created: ${campaign_name} (ID: ${campaignId})`);
            
            if (auto_send) {
              // Auto-send to target segment
              this.executeCampaign(campaignId);
            }
            
            resolve({ campaignId, campaign_name });
          }
        });
      });
    } catch (error) {
      console.error('Error creating upsell campaign:', error);
      throw error;
    }
  }

  async executeCampaign(campaignId) {
    try {
      // Get campaign details
      const campaign = await this.getCampaignById(campaignId);
      if (!campaign) return;

      // Get target subscribers
      const targetSubscribers = await this.getTargetSubscribers(campaign.target_segment);
      
      let messagesSent = 0;
      let conversions = 0;
      let totalRevenue = 0;

      for (const subscriber of targetSubscribers) {
        // Generate personalized upsell message
        const upsellResult = await this.generateUpsellMessage({
          subscriber_tier: subscriber.tier,
          target_tier: this.getUpgradeTier(subscriber.tier),
          spending_history: subscriber.total_spent,
          engagement_level: this.calculateEngagementLevel(subscriber),
          campaign_type: 'tier_upgrade'
        });

        if (upsellResult.success) {
          // Send message (simulate for now)
          await this.sendUpsellMessage(subscriber.id, upsellResult, campaignId);
          messagesSent++;

          // Simulate conversion (random for demo)
          if (Math.random() < 0.15) { // 15% conversion rate
            const conversionRevenue = upsellResult.pricing.final_price;
            await this.recordRevenueEvent({
              subscriber_id: subscriber.id,
              event_type: 'upsell_conversion',
              amount: conversionRevenue,
              campaign_id: campaignId,
              tier_before: subscriber.tier,
              tier_after: this.getUpgradeTier(subscriber.tier)
            });
            conversions++;
            totalRevenue += conversionRevenue;
          }
        }

        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update campaign stats
      this.db.run(`
        UPDATE upsell_campaigns 
        SET messages_sent = ?, conversions = ?, revenue_generated = ?, success_rate = ?
        WHERE id = ?
      `, [messagesSent, conversions, totalRevenue, (conversions / messagesSent * 100), campaignId]);

      console.log(`✅ Campaign executed: ${messagesSent} messages sent, ${conversions} conversions, $${totalRevenue} revenue`);
      
      return {
        campaign_id: campaignId,
        messages_sent: messagesSent,
        conversions: conversions,
        revenue_generated: totalRevenue,
        success_rate: (conversions / messagesSent * 100).toFixed(2)
      };

    } catch (error) {
      console.error('Error executing campaign:', error);
      throw error;
    }
  }

  async getCampaignById(campaignId) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM upsell_campaigns WHERE id = ?', [campaignId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getTargetSubscribers(segment) {
    let query = 'SELECT * FROM subscribers WHERE status = "active"';
    
    switch(segment) {
      case 'bronze_tier':
        query += ' AND tier = "Bronze"';
        break;
      case 'high_spenders':
        query += ' AND total_spent > 100';
        break;
      case 'at_risk':
        query += ' AND last_activity < date("now", "-14 days")';
        break;
      case 'new_subscribers':
        query += ' AND subscription_date >= date("now", "-7 days")';
        break;
    }
    
    query += ' LIMIT 50'; // Limit for demo

    return new Promise((resolve, reject) => {
      this.db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  getUpgradeTier(currentTier) {
    const tierProgression = {
      'Bronze': 'Silver',
      'Silver': 'Gold',
      'Gold': 'Platinum'
    };
    return tierProgression[currentTier] || 'Gold';
  }

  calculateEngagementLevel(subscriber) {
    const daysSinceActivity = Math.floor(
      (new Date() - new Date(subscriber.last_activity)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceActivity <= 3) return 'high';
    if (daysSinceActivity <= 7) return 'medium';
    return 'low';
  }

  async sendUpsellMessage(subscriberId, upsellData, campaignId) {
    // Integration with CRM messaging system
    try {
      const messageData = {
        subscriber_id: subscriberId,
        message_type: 'upsell',
        subject: `Special upgrade offer just for you! 💎`,
        content: upsellData.message
      };

      this.db.run(`
        INSERT INTO crm_messages (subscriber_id, message_type, subject, content)
        VALUES (?, ?, ?, ?)
      `, [subscriberId, messageData.message_type, messageData.subject, messageData.content]);

      console.log(`📩 Upsell message sent to subscriber ${subscriberId}`);
    } catch (error) {
      console.error('Error sending upsell message:', error);
    }
  }

  async recordRevenueEvent(eventData) {
    const {
      subscriber_id,
      event_type,
      amount,
      tier_before = null,
      tier_after = null,
      campaign_id = null,
      ab_test_id = null,
      description = ''
    } = eventData;

    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO revenue_events 
        (subscriber_id, event_type, amount, tier_before, tier_after, campaign_id, ab_test_id, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [subscriber_id, event_type, amount, tier_before, tier_after, campaign_id, ab_test_id, description], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Analytics and Reporting
  async getRevenueAnalytics(days = 30) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          event_type,
          COUNT(*) as event_count,
          SUM(amount) as total_revenue,
          AVG(amount) as avg_revenue,
          DATE(created_at) as date
        FROM revenue_events 
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY event_type, DATE(created_at)
        ORDER BY date DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getCampaignPerformance() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          campaign_name,
          target_segment,
          messages_sent,
          conversions,
          revenue_generated,
          success_rate,
          created_at
        FROM upsell_campaigns 
        ORDER BY created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async getABTestResults() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          t.test_name,
          t.target_metric,
          t.status,
          v.variant_name,
          v.conversion_rate,
          v.revenue_per_user,
          v.sample_size
        FROM ab_tests t
        JOIN ab_test_variants v ON t.id = v.test_id
        ORDER BY t.created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = RevenueOptimizationService;