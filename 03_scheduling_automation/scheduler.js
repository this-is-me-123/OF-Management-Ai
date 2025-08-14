/**
 * scheduler.js
 *
 * Core logic: reads scheduled items from DB and publishes them.
 */
const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config/scheduler.config');
const { publishPost } = require('./publishService');

// Initialize database
const dbPath = path.join(__dirname, '../../crm.db');
const db = new sqlite3.Database(dbPath);

// Initialize posts table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS scheduled_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    caption TEXT,
    hashtags TEXT,
    platform TEXT DEFAULT 'onlyfans',
    publish_time DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME NULL
  )
`);

console.log('Scheduler started with config:', config);

// Run every minute to check for new posts to publish
cron.schedule('* * * * *', async () => {
  console.log('Checking for due posts...');
  const duePosts = await getDuePosts();
  
  for (const post of duePosts) {
    try {
      await publishPost(post);
      await markPostAsPublished(post.id);
      console.log(`✅ Successfully published post ${post.id}`);
    } catch (error) {
      console.error(`❌ Failed to publish post ${post.id}:`, error.message);
      await markPostAsFailed(post.id, error.message);
    }
  }
});

async function getDuePosts() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM scheduled_posts 
      WHERE status = 'pending' 
      AND publish_time <= datetime('now')
      ORDER BY publish_time ASC
      LIMIT 10
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

async function markPostAsPublished(postId) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE scheduled_posts 
      SET status = 'published', published_at = datetime('now')
      WHERE id = ?
    `;
    
    db.run(query, [postId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

async function markPostAsFailed(postId, errorMessage) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE scheduled_posts 
      SET status = 'failed'
      WHERE id = ?
    `;
    
    db.run(query, [postId], function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`Marked post ${postId} as failed: ${errorMessage}`);
        resolve(this.changes);
      }
    });
  });
}

// API to schedule new posts
async function schedulePost(postData) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO scheduled_posts (content, caption, hashtags, platform, publish_time)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const { content, caption, hashtags, platform = 'onlyfans', publishTime } = postData;
    
    db.run(query, [content, caption, hashtags, platform, publishTime], function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`📅 Scheduled post ${this.lastID} for ${publishTime}`);
        resolve(this.lastID);
      }
    });
  });
}

// API to get scheduled posts
async function getScheduledPosts(limit = 50) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM scheduled_posts 
      ORDER BY publish_time DESC 
      LIMIT ?
    `;
    
    db.all(query, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down scheduler...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

module.exports = { schedulePost, getScheduledPosts, getDuePosts };
