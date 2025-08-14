const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class AIContentService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.loadSampleData();
  }

  async loadSampleData() {
    try {
      const templatePath = path.join(__dirname, '../../../sample_data/content_generation_prompts.json');
      const campaignPath = path.join(__dirname, '../../../sample_data/campaign_examples.json');
      
      this.templates = JSON.parse(await fs.readFile(templatePath, 'utf8'));
      this.campaigns = JSON.parse(await fs.readFile(campaignPath, 'utf8'));
    } catch (error) {
      console.warn('[AIContentService] Could not load sample data:', error.message);
      this.templates = {};
      this.campaigns = {};
    }
  }

  /**
   * Generate AI-powered caption for posts
   * @param {string} contentType - Type of content (teaser, ppv_promo, engagement, lifestyle)
   * @param {Object} context - Additional context for generation
   * @returns {Promise<string>} Generated caption
   */
  async generateCaption(contentType, context = {}) {
    try {
      const systemPrompt = this.templates.ai_prompt_templates?.caption_generation?.system_prompt || 
        "You are a social media content creator who writes engaging, flirty, and authentic captions.";
      
      const contentTypeInstructions = this.templates.ai_prompt_templates?.caption_generation?.content_types?.[contentType] || 
        "Write an engaging caption for social media.";

      const userPrompt = `Create a ${contentType} caption. ${contentTypeInstructions}
      
      Context: ${JSON.stringify(context, null, 2)}
      
      Requirements:
      - Use appropriate emojis naturally
      - Keep the tone playful and engaging
      - Include a call-to-action when appropriate
      - Length: 1-3 sentences
      - Make it feel authentic and personal`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.8,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('[AIContentService] Caption generation failed:', error);
      // Fallback to template-based generation
      return this.generateTemplateCaption(contentType, context);
    }
  }

  /**
   * Fallback template-based caption generation
   * @param {string} contentType 
   * @param {Object} context 
   * @returns {string} Template-based caption
   */
  generateTemplateCaption(contentType, context = {}) {
    const templates = this.templates.caption_templates?.[contentType] || 
      this.templates.caption_templates?.teaser_posts || 
      ["Hey gorgeous! 💕 Something special coming your way..."];
    
    let caption = templates[Math.floor(Math.random() * templates.length)];
    
    // Replace variables in template
    if (context.price) {
      caption = caption.replace(/\$\{price\}/g, context.price);
    }
    
    return caption;
  }

  /**
   * Generate personalized message for subscriber
   * @param {Object} subscriber - Subscriber data
   * @param {string} messageType - Type of message (welcome, retention, ppv_offer)
   * @param {Object} context - Additional context
   * @returns {Promise<string>} Personalized message
   */
  async generatePersonalizedMessage(subscriber, messageType, context = {}) {
    try {
      const systemPrompt = `You are an AI assistant that writes personalized messages for OnlyFans creators. 
      Your messages should be engaging, flirty, and make subscribers feel special and valued.
      Adapt your tone based on the subscriber's tier and engagement level.`;

      const userPrompt = `Generate a ${messageType} message for a subscriber with these details:
      
      Subscriber Info:
      - Tier: ${subscriber.tier || 'bronze'}
      - Days subscribed: ${subscriber.days_subscribed || 0}
      - Engagement level: ${subscriber.engagement_level || 'low'}
      - Last interaction: ${subscriber.last_interaction || 'none'}
      - Spending level: ${subscriber.spending_level || 'low'}
      
      Message Type: ${messageType}
      Context: ${JSON.stringify(context, null, 2)}
      
      Requirements:
      - Personalize based on their tier and behavior
      - Keep it authentic and conversational
      - Include relevant emojis
      - Length: 1-2 sentences
      - Include a clear call-to-action if appropriate`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('[AIContentService] Personalized message generation failed:', error);
      return this.generateTemplateMessage(subscriber, messageType, context);
    }
  }

  /**
   * Fallback template-based message generation
   * @param {Object} subscriber 
   * @param {string} messageType 
   * @param {Object} context 
   * @returns {string} Template-based message
   */
  generateTemplateMessage(subscriber, messageType, context = {}) {
    // Use sample data templates as fallback
    const tierTemplates = this.templates.subscriber_tiers?.[subscriber.tier]?.templates;
    if (tierTemplates && tierTemplates[messageType]) {
      return tierTemplates[messageType];
    }
    
    // Generic fallback
    const fallbacks = {
      welcome: "Welcome beautiful! 💕 So excited to have you here with me!",
      retention: "Miss you! 💔 I've got something special waiting for you...",
      ppv_offer: "Something exclusive just for you 💎 Want to see?"
    };
    
    return fallbacks[messageType] || fallbacks.welcome;
  }

  /**
   * Generate campaign content sequence
   * @param {Object} campaignConfig - Campaign configuration
   * @returns {Promise<Array>} Array of generated content pieces
   */
  async generateCampaignSequence(campaignConfig) {
    try {
      const sequence = [];
      const { type, duration_days = 3, target_audience, theme } = campaignConfig;

      for (let day = 0; day < duration_days; day++) {
        const contentType = this.selectContentTypeForDay(day, type);
        const context = {
          day: day,
          campaign_type: type,
          target_audience: target_audience,
          theme: theme
        };

        const caption = await this.generateCaption(contentType, context);
        
        sequence.push({
          day: day,
          content_type: contentType,
          caption: caption,
          optimal_time: this.getOptimalPostingTime(contentType),
          context: context
        });
      }

      return sequence;
    } catch (error) {
      console.error('[AIContentService] Campaign sequence generation failed:', error);
      return [];
    }
  }

  /**
   * Select appropriate content type for campaign day
   * @param {number} day 
   * @param {string} campaignType 
   * @returns {string} Content type
   */
  selectContentTypeForDay(day, campaignType) {
    const patterns = {
      seasonal: ['teaser', 'engagement', 'ppv_promo'],
      retention: ['engagement', 'ppv_promo', 'lifestyle'],
      onboarding: ['lifestyle', 'teaser', 'ppv_promo']
    };
    
    const pattern = patterns[campaignType] || patterns.seasonal;
    return pattern[day % pattern.length];
  }

  /**
   * Get optimal posting time for content type
   * @param {string} contentType 
   * @returns {string} Time in HH:MM format
   */
  getOptimalPostingTime(contentType) {
    const timings = this.templates.content_optimization?.posting_schedule_optimization?.content_type_timing || {};
    
    const timeMap = {
      morning: '09:00',
      afternoon: '15:00', 
      evening: '20:00'
    };
    
    const timeOfDay = timings[contentType] || 'afternoon';
    return timeMap[timeOfDay];
  }

  /**
   * Analyze content performance and suggest optimizations
   * @param {Object} contentData - Historical content performance
   * @returns {Promise<Object>} Analysis and suggestions
   */
  async analyzeContentPerformance(contentData) {
    try {
      const systemPrompt = `You are an AI content strategist who analyzes OnlyFans content performance data 
      and provides actionable insights and optimization recommendations.`;

      const userPrompt = `Analyze this content performance data and provide optimization suggestions:
      
      ${JSON.stringify(contentData, null, 2)}
      
      Please provide:
      1. Top 3 insights from the data
      2. Specific optimization recommendations
      3. Content type suggestions for improvement
      4. Timing optimization suggestions
      
      Format as JSON with insights, recommendations, and action_items arrays.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('[AIContentService] Performance analysis failed:', error);
      return {
        insights: ["Analysis temporarily unavailable"],
        recommendations: ["Try posting at different times"],
        action_items: ["Review content performance manually"]
      };
    }
  }

  /**
   * Generate image prompts for AI image generation
   * @param {string} style - Image style (portrait, lifestyle, artistic)
   * @param {Object} context - Additional context
   * @returns {string} AI image generation prompt
   */
  generateImagePrompt(style, context = {}) {
    const prompts = this.templates.ai_prompt_templates?.image_generation;
    
    if (!prompts || !prompts[style]) {
      return "Professional portrait photography, high quality, attractive woman";
    }
    
    const stylePrompts = prompts[style];
    let basePrompt = stylePrompts[Math.floor(Math.random() * stylePrompts.length)];
    
    // Add context-specific modifiers
    if (context.theme) {
      basePrompt += `, ${context.theme} theme`;
    }
    
    if (context.mood) {
      basePrompt += `, ${context.mood} mood`;
    }
    
    return basePrompt;
  }

  /**
   * Get content suggestions based on current trends
   * @param {Object} trendData - Current trend data
   * @returns {Array} Content suggestions
   */
  getContentSuggestions(trendData = {}) {
    const suggestions = [];
    
    // Based on day of week
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const weeklyStructure = this.templates.content_calendar_templates?.weekly_structure;
    
    if (weeklyStructure && weeklyStructure[today]) {
      suggestions.push({
        type: 'weekly_theme',
        suggestion: `It's ${weeklyStructure[today].type}! Consider posting ${weeklyStructure[today].content}`,
        priority: 'medium'
      });
    }
    
    // Based on performance data
    if (trendData.low_engagement) {
      suggestions.push({
        type: 'engagement_boost',
        suggestion: 'Engagement is down. Try posting a question or interactive content',
        priority: 'high'
      });
    }
    
    if (trendData.high_ppv_conversion) {
      suggestions.push({
        type: 'revenue_opportunity',
        suggestion: 'PPV conversion is high! Consider launching a premium campaign',
        priority: 'high'
      });
    }
    
    return suggestions;
  }
}

module.exports = AIContentService;