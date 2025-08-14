const express = require('express');
const router = express.Router();
const AIContentService = require('../aiContentService');

// Initialize AI Content Service
const aiContentService = new AIContentService();

// Health check endpoint for /content
router.get('/', (req, res) => {
  res.json({ status: 'AI content generation module active' });
});

// Generate caption endpoint
router.post('/generate-caption', async (req, res) => {
  try {
    const { contentType, context } = req.body;
    
    if (!contentType) {
      return res.status(400).json({ 
        error: 'contentType is required',
        supportedTypes: ['teaser', 'ppv_promo', 'engagement', 'lifestyle']
      });
    }

    const caption = await aiContentService.generateCaption(contentType, context);
    
    res.json({
      success: true,
      caption: caption,
      contentType: contentType,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Caption generation failed:', error);
    res.status(500).json({ 
      error: 'Caption generation failed', 
      details: error.message 
    });
  }
});

// Generate personalized message endpoint
router.post('/generate-message', async (req, res) => {
  try {
    const { subscriber, messageType, context } = req.body;
    
    if (!subscriber || !messageType) {
      return res.status(400).json({ 
        error: 'subscriber and messageType are required',
        supportedTypes: ['welcome', 'retention', 'ppv_offer', 'engagement']
      });
    }

    const message = await aiContentService.generatePersonalizedMessage(subscriber, messageType, context);
    
    res.json({
      success: true,
      message: message,
      messageType: messageType,
      subscriberId: subscriber.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Message generation failed:', error);
    res.status(500).json({ 
      error: 'Message generation failed', 
      details: error.message 
    });
  }
});

// Generate campaign sequence endpoint
router.post('/generate-campaign', async (req, res) => {
  try {
    const { campaignConfig } = req.body;
    
    if (!campaignConfig || !campaignConfig.type) {
      return res.status(400).json({ 
        error: 'campaignConfig with type is required',
        supportedTypes: ['seasonal', 'retention', 'onboarding', 'promotional']
      });
    }

    const sequence = await aiContentService.generateCampaignSequence(campaignConfig);
    
    res.json({
      success: true,
      campaign: {
        id: `campaign_${Date.now()}`,
        type: campaignConfig.type,
        duration_days: campaignConfig.duration_days || 3,
        sequence: sequence,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Content API] Campaign generation failed:', error);
    res.status(500).json({ 
      error: 'Campaign generation failed', 
      details: error.message 
    });
  }
});

// Analyze content performance endpoint
router.post('/analyze-performance', async (req, res) => {
  try {
    const { contentData } = req.body;
    
    if (!contentData) {
      return res.status(400).json({ 
        error: 'contentData is required for analysis'
      });
    }

    const analysis = await aiContentService.analyzeContentPerformance(contentData);
    
    res.json({
      success: true,
      analysis: analysis,
      analyzed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Performance analysis failed:', error);
    res.status(500).json({ 
      error: 'Performance analysis failed', 
      details: error.message 
    });
  }
});

// Generate image prompt endpoint
router.post('/generate-image-prompt', async (req, res) => {
  try {
    const { style, context } = req.body;
    
    if (!style) {
      return res.status(400).json({ 
        error: 'style is required',
        supportedStyles: ['portrait', 'lifestyle', 'artistic']
      });
    }

    const prompt = aiContentService.generateImagePrompt(style, context);
    
    res.json({
      success: true,
      prompt: prompt,
      style: style,
      context: context,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Image prompt generation failed:', error);
    res.status(500).json({ 
      error: 'Image prompt generation failed', 
      details: error.message 
    });
  }
});

// Get content suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const trendData = req.query;
    const suggestions = aiContentService.getContentSuggestions(trendData);
    
    res.json({
      success: true,
      suggestions: suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Suggestions generation failed:', error);
    res.status(500).json({ 
      error: 'Suggestions generation failed', 
      details: error.message 
    });
  }
});

// Bulk caption generation endpoint
router.post('/generate-captions-bulk', async (req, res) => {
  try {
    const { requests } = req.body;
    
    if (!requests || !Array.isArray(requests)) {
      return res.status(400).json({ 
        error: 'requests array is required'
      });
    }

    const results = [];
    
    for (const request of requests) {
      try {
        const caption = await aiContentService.generateCaption(
          request.contentType, 
          request.context
        );
        
        results.push({
          id: request.id,
          success: true,
          caption: caption,
          contentType: request.contentType
        });
      } catch (error) {
        results.push({
          id: request.id,
          success: false,
          error: error.message,
          contentType: request.contentType
        });
      }
    }
    
    res.json({
      success: true,
      results: results,
      processed: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Bulk caption generation failed:', error);
    res.status(500).json({ 
      error: 'Bulk caption generation failed', 
      details: error.message 
    });
  }
});

// Template-based generation endpoint (fallback)
router.post('/generate-template', async (req, res) => {
  try {
    const { contentType, context } = req.body;
    
    if (!contentType) {
      return res.status(400).json({ 
        error: 'contentType is required'
      });
    }

    const caption = aiContentService.generateTemplateCaption(contentType, context);
    
    res.json({
      success: true,
      caption: caption,
      contentType: contentType,
      method: 'template',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Content API] Template generation failed:', error);
    res.status(500).json({ 
      error: 'Template generation failed', 
      details: error.message 
    });
  }
});

module.exports = router;