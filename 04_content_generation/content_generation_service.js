/**
 * content_generation_service.js
 *
 * Comprehensive content generation service for OFEM
 * Combines AI image generation, caption creation, and hashtag optimization
 */
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

class ContentGenerationService {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.loadPromptTemplates();
    this.setupDirectories();
  }

  setupDirectories() {
    const dirs = ['../assets/generated_images', '../assets/generated_content'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  loadPromptTemplates() {
    try {
      this.imagePrompts = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../prompt_templates/cover_image_prompts.json'), 'utf8')
      );
      this.captionPrompts = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../prompt_templates/teaser_caption_prompts.json'), 'utf8')
      );
      console.log('✅ Prompt templates loaded');
    } catch (error) {
      console.warn('⚠️ Could not load prompt templates, using defaults');
      this.setupDefaultPrompts();
    }
  }

  setupDefaultPrompts() {
    this.imagePrompts = {
      prompts: [
        "Beautiful woman in elegant lingerie, soft studio lighting, professional photography, artistic composition",
        "Confident pose in luxurious bedroom setting, warm golden lighting, silk sheets",
        "Glamorous evening look with elegant makeup, sophisticated and alluring",
        "Cozy intimate setting with candles, romantic and dreamy atmosphere",
        "Fitness-inspired confident pose, athletic wear, empowering energy"
      ]
    };

    this.captionPrompts = {
      templates: [
        "Just dropped something special for my VIPs 💎 What do you think?",
        "Feeling absolutely incredible today ✨ Ready to see more?",
        "Your girl is serving LOOKS tonight 🔥 DM me for exclusive content",
        "Behind the scenes moment just for you 💋 More coming soon...",
        "This is just a taste of what's waiting in my DMs 😈"
      ]
    };
  }

  // Image Generation using multiple providers
  async generateImage(prompt, style = 'default', dimensions = '1024x1024') {
    const enhancedPrompt = this.enhanceImagePrompt(prompt, style);
    console.log(`🎨 Generating image with prompt: ${enhancedPrompt}`);

    try {
      // Try OpenAI DALL-E first
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: dimensions,
        quality: "hd",
        style: "vivid"
      });

      const imageUrl = response.data[0].url;
      const imageData = await this.downloadImage(imageUrl);
      
      const filename = `generated_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
      const filepath = path.join(__dirname, '../assets/generated_images', filename);
      
      fs.writeFileSync(filepath, imageData);
      
      console.log(`✅ Image saved: ${filename}`);
      return {
        success: true,
        filename,
        filepath,
        prompt: enhancedPrompt,
        url: imageUrl
      };

    } catch (error) {
      console.error('❌ Image generation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  enhanceImagePrompt(basePrompt, style) {
    const styleModifiers = {
      professional: "professional photography, studio lighting, high resolution, detailed",
      artistic: "artistic composition, creative lighting, aesthetic, visually striking",
      intimate: "intimate setting, warm lighting, cozy atmosphere, personal",
      glamorous: "glamorous, elegant, luxurious, high-end fashion photography",
      casual: "natural, candid, relaxed atmosphere, authentic feel"
    };

    const qualityModifiers = "8k uhd, high quality, detailed, photorealistic";
    const safetyModifiers = "tasteful, artistic, elegant, professional";
    
    const modifier = styleModifiers[style] || styleModifiers.professional;
    
    return `${basePrompt}, ${modifier}, ${qualityModifiers}, ${safetyModifiers}`;
  }

  async downloadImage(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }

  // Advanced Caption Generation
  async generateCaption(context = {}) {
    const { 
      content_type = 'photo',
      mood = 'confident',
      target_audience = 'subscribers',
      call_to_action = true,
      include_emojis = true 
    } = context;

    try {
      const prompt = this.buildCaptionPrompt(content_type, mood, target_audience, call_to_action);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a social media expert specializing in OnlyFans content creation. Create engaging, authentic captions that connect with subscribers while maintaining a flirty but professional tone. Always include relevant emojis and encourage engagement."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      });

      const caption = response.choices[0].message.content.trim();
      const hashtags = await this.generateHashtags(content_type, mood);

      console.log('✅ Caption generated successfully');
      return {
        success: true,
        caption,
        hashtags,
        context
      };

    } catch (error) {
      console.error('❌ Caption generation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  buildCaptionPrompt(contentType, mood, audience, includeCallToAction) {
    return `Create an engaging OnlyFans caption for a ${contentType} with a ${mood} mood, targeting ${audience}. 
    ${includeCallToAction ? 'Include a subtle call-to-action to encourage DMs or engagement.' : ''}
    
    Guidelines:
    - Keep it authentic and personal
    - Use 2-4 relevant emojis
    - Length: 50-150 characters
    - Tone: Flirty but classy
    - Encourage interaction
    
    Caption:`;
  }

  async generateHashtags(contentType, mood, limit = 8) {
    const baseHashtags = {
      photo: ['#photooftheday', '#mood', '#vibes', '#exclusive'],
      video: ['#videooftheday', '#exclusive', '#content', '#mood'],
      selfie: ['#selfie', '#mood', '#vibes', '#me'],
      behind_scenes: ['#bts', '#behindthescenes', '#exclusive', '#content']
    };

    const moodHashtags = {
      confident: ['#confident', '#powerful', '#bossbabe'],
      playful: ['#playful', '#fun', '#cheeky'],
      elegant: ['#elegant', '#classy', '#sophisticated'],
      cozy: ['#cozy', '#intimate', '#relaxed'],
      glamorous: ['#glamorous', '#luxury', '#glam']
    };

    const generalHashtags = ['#onlyfans', '#exclusive', '#content', '#subscribers', '#vip'];
    
    const selectedTags = [
      ...(baseHashtags[contentType] || baseHashtags.photo),
      ...(moodHashtags[mood] || moodHashtags.confident),
      ...generalHashtags
    ];

    // Remove duplicates and limit
    const uniqueTags = [...new Set(selectedTags)].slice(0, limit);
    return uniqueTags.join(' ');
  }

  // Complete Content Package Generation
  async createContentPackage(options = {}) {
    const {
      content_type = 'photo',
      style = 'professional',
      mood = 'confident',
      include_image = true,
      include_caption = true,
      custom_prompt = null
    } = options;

    console.log('🚀 Creating complete content package...');
    
    const results = {
      package_id: crypto.randomBytes(8).toString('hex'),
      created_at: new Date().toISOString(),
      options
    };

    try {
      // Generate image if requested
      if (include_image) {
        const imagePrompt = custom_prompt || this.getRandomPrompt('image');
        const imageResult = await this.generateImage(imagePrompt, style);
        results.image = imageResult;
      }

      // Generate caption if requested
      if (include_caption) {
        const captionContext = { content_type, mood, target_audience: 'subscribers' };
        const captionResult = await this.generateCaption(captionContext);
        results.caption = captionResult;
      }

      // Generate posting schedule suggestion
      results.posting_suggestion = this.generatePostingSchedule();

      // Save package metadata
      const packagePath = path.join(__dirname, '../assets/generated_content', `package_${results.package_id}.json`);
      fs.writeFileSync(packagePath, JSON.stringify(results, null, 2));

      console.log(`✅ Content package created: ${results.package_id}`);
      return results;

    } catch (error) {
      console.error('❌ Content package creation failed:', error.message);
      results.error = error.message;
      return results;
    }
  }

  getRandomPrompt(type = 'image') {
    const prompts = type === 'image' ? this.imagePrompts.prompts : this.captionPrompts.templates;
    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  generatePostingSchedule() {
    const bestTimes = [
      { day: 'Monday', time: '20:00', reason: 'High engagement start of week' },
      { day: 'Wednesday', time: '19:00', reason: 'Mid-week peak activity' },
      { day: 'Friday', time: '18:00', reason: 'Weekend anticipation' },
      { day: 'Sunday', time: '15:00', reason: 'Lazy Sunday browsing' }
    ];

    return {
      suggested_times: bestTimes,
      optimal_frequency: '3-4 posts per week',
      best_days: ['Monday', 'Wednesday', 'Friday', 'Sunday']
    };
  }

  // Batch Content Generation
  async generateBatch(count = 5, options = {}) {
    console.log(`🔄 Generating batch of ${count} content packages...`);
    
    const results = [];
    for (let i = 0; i < count; i++) {
      console.log(`📦 Creating package ${i + 1}/${count}`);
      
      // Vary the options for each package
      const packageOptions = {
        ...options,
        style: ['professional', 'artistic', 'glamorous', 'casual'][i % 4],
        mood: ['confident', 'playful', 'elegant', 'cozy'][i % 4]
      };

      const result = await this.createContentPackage(packageOptions);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Batch generation complete: ${results.length} packages created`);
    return results;
  }

  // Integration with scheduler
  async scheduleGeneratedContent(packageId, scheduleTime) {
    try {
      const packagePath = path.join(__dirname, '../assets/generated_content', `package_${packageId}.json`);
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Prepare data for scheduler API
      const postData = {
        content: packageData.image?.filepath || 'Generated content',
        caption: packageData.caption?.caption || 'New content available!',
        hashtags: packageData.caption?.hashtags || '',
        platform: 'onlyfans',
        publishTime: scheduleTime
      };

      // Call scheduler API
      const response = await axios.post('http://localhost:3001/api/posts/schedule', postData);
      
      console.log(`✅ Content scheduled successfully: ${response.data.postId}`);
      return { success: true, postId: response.data.postId, packageId };

    } catch (error) {
      console.error('❌ Failed to schedule content:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Analytics integration
  async getContentPerformanceData() {
    try {
      const response = await axios.get('http://localhost:3003/api/dashboard');
      return response.data;
    } catch (error) {
      console.warn('Could not fetch analytics data:', error.message);
      return null;
    }
  }
}

module.exports = ContentGenerationService;