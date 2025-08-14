/**
 * content_api.js
 *
 * Express API server for content generation management
 */
const express = require('express');
const cors = require('cors');
const ContentGenerationService = require('./content_generation_service');

const app = express();
const PORT = process.env.CONTENT_PORT || 3004;

// Initialize content generation service
const contentService = new ContentGenerationService();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/assets', express.static('assets'));

// Routes

// Generate single image
app.post('/api/generate/image', async (req, res) => {
  try {
    const { prompt, style = 'professional', dimensions = '1024x1024' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await contentService.generateImage(prompt, style, dimensions);
    res.json(result);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Generate caption
app.post('/api/generate/caption', async (req, res) => {
  try {
    const context = req.body;
    const result = await contentService.generateCaption(context);
    res.json(result);
  } catch (error) {
    console.error('Error generating caption:', error);
    res.status(500).json({ error: 'Failed to generate caption' });
  }
});

// Generate complete content package
app.post('/api/generate/package', async (req, res) => {
  try {
    const options = req.body;
    const result = await contentService.createContentPackage(options);
    res.json(result);
  } catch (error) {
    console.error('Error creating content package:', error);
    res.status(500).json({ error: 'Failed to create content package' });
  }
});

// Generate batch of content packages
app.post('/api/generate/batch', async (req, res) => {
  try {
    const { count = 5, options = {} } = req.body;
    
    if (count > 10) {
      return res.status(400).json({ error: 'Maximum batch size is 10 packages' });
    }
    
    const results = await contentService.generateBatch(count, options);
    res.json({
      success: true,
      packages_created: results.length,
      packages: results
    });
  } catch (error) {
    console.error('Error generating batch:', error);
    res.status(500).json({ error: 'Failed to generate batch' });
  }
});

// Schedule generated content
app.post('/api/schedule/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const { scheduleTime } = req.body;
    
    if (!scheduleTime) {
      return res.status(400).json({ error: 'Schedule time is required' });
    }
    
    const result = await contentService.scheduleGeneratedContent(packageId, scheduleTime);
    res.json(result);
  } catch (error) {
    console.error('Error scheduling content:', error);
    res.status(500).json({ error: 'Failed to schedule content' });
  }
});

// Get content performance analytics
app.get('/api/analytics/performance', async (req, res) => {
  try {
    const data = await contentService.getContentPerformanceData();
    res.json(data || { message: 'Analytics data not available' });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get random prompt suggestions
app.get('/api/prompts/:type', (req, res) => {
  try {
    const { type } = req.params;
    const prompt = contentService.getRandomPrompt(type);
    res.json({ prompt, type });
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

// Get posting schedule suggestions
app.get('/api/schedule/suggestions', (req, res) => {
  try {
    const suggestions = contentService.generatePostingSchedule();
    res.json(suggestions);
  } catch (error) {
    console.error('Error getting schedule suggestions:', error);
    res.status(500).json({ error: 'Failed to get schedule suggestions' });
  }
});

// Content workflow automation
app.post('/api/workflow/auto-generate', async (req, res) => {
  try {
    const { 
      schedule_count = 7, 
      days_ahead = 7,
      content_mix = { photo: 0.6, video: 0.3, selfie: 0.1 }
    } = req.body;

    console.log(`🤖 Starting automated content generation for ${schedule_count} posts over ${days_ahead} days`);
    
    const results = [];
    const contentTypes = Object.keys(content_mix);
    
    for (let i = 0; i < schedule_count; i++) {
      // Select content type based on mix
      const random = Math.random();
      let cumulative = 0;
      let selectedType = 'photo';
      
      for (const [type, weight] of Object.entries(content_mix)) {
        cumulative += weight;
        if (random <= cumulative) {
          selectedType = type;
          break;
        }
      }
      
      // Generate content package
      const packageResult = await contentService.createContentPackage({
        content_type: selectedType,
        include_image: true,
        include_caption: true
      });
      
      if (packageResult.success !== false) {
        // Schedule for future posting
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + Math.floor(i * days_ahead / schedule_count));
        scheduleDate.setHours(19 + (i % 3), Math.floor(Math.random() * 60), 0);
        
        const scheduleResult = await contentService.scheduleGeneratedContent(
          packageResult.package_id,
          scheduleDate.toISOString()
        );
        
        results.push({
          package: packageResult,
          scheduled: scheduleResult,
          content_type: selectedType,
          schedule_time: scheduleDate.toISOString()
        });
      }
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    res.json({
      success: true,
      message: `Automated workflow completed: ${results.length} posts generated and scheduled`,
      results
    });
    
  } catch (error) {
    console.error('Error in automated workflow:', error);
    res.status(500).json({ error: 'Automated workflow failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Content Generation',
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎨 Content Generation API server running on port ${PORT}`);
  console.log(`🔗 Generate content: http://localhost:${PORT}/api/generate/package`);
  console.log(`🤖 Auto workflow: http://localhost:${PORT}/api/workflow/auto-generate`);
});

module.exports = app;