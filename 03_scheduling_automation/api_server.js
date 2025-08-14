/**
 * api_server.js
 *
 * Express API server for managing scheduled posts
 */
const express = require('express');
const cors = require('cors');
const { schedulePost, getScheduledPosts } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/api/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const posts = await getScheduledPosts(limit);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts/schedule', async (req, res) => {
  try {
    const { content, caption, hashtags, platform, publishTime } = req.body;
    
    // Validation
    if (!content || !publishTime) {
      return res.status(400).json({ error: 'Content and publishTime are required' });
    }
    
    const postId = await schedulePost({
      content,
      caption,
      hashtags,
      platform: platform || 'onlyfans',
      publishTime
    });
    
    res.json({ success: true, postId, message: 'Post scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling post:', error);
    res.status(500).json({ error: 'Failed to schedule post' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const allPosts = await getScheduledPosts(1000);
    const stats = {
      total: allPosts.length,
      pending: allPosts.filter(p => p.status === 'pending').length,
      published: allPosts.filter(p => p.status === 'published').length,
      failed: allPosts.filter(p => p.status === 'failed').length
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`📡 Scheduler API server running on port ${PORT}`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api/posts`);
});

module.exports = app;