// publishService.js
// Service for posting content to OnlyFans or other platforms using browser automation.
// Integrates with the browser automation service for OnlyFans posting.

const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');
const config = require('./config/scheduler.config');

// Database connection for job queue
const db = new Database(path.join(__dirname, 'browser_automation_service/backend/logs.db'));

/**
 * Publish a post using the configured endpoint or browser automation.
 * @param {Object} post - Post object containing content and metadata.
 */
async function publishPost(post) {
  try {
    console.log(`Publishing post to ${post?.platform}: ${post?.id ?? '<no-id>'}`);

    if (!post || !post.platform) {
      throw new Error('publishPost: missing required field "platform"');
    }

    switch (post.platform) {
      case 'hootsuite':
        return await axios.post(config.hootsuiteEndpoint, post);
      
      case 'onlyfans':
        return await publishToOnlyFans(post);
      
      default:
        throw new Error(`Unsupported platform: ${post.platform}`);
    }
  } catch (err) {
    console.error('Failed to publish post', err.message);
    throw err;
  }
}

/**
 * Publish content to OnlyFans using browser automation service.
 * @param {Object} post - Post object with content, media, and metadata.
 */
async function publishToOnlyFans(post) {
  try {
    // Create a job in the automation queue
    const jobData = {
      type: 'post_content',
      folder: post.folder || `post_${post.id}_${Date.now()}`,
      content: {
        text: post.content || post.text,
        media: post.media || [],
        scheduledTime: post.scheduledTime,
        tags: post.tags || []
      },
      status: 'queued',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert job into the queue
    const result = db.prepare(`
      INSERT INTO jobs (type, folder, content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      jobData.type,
      jobData.folder,
      JSON.stringify(jobData.content),
      jobData.status,
      jobData.created_at,
      jobData.updated_at
    );

    console.log(`OnlyFans post job ${result.lastInsertRowid} queued for processing`);
    
    return {
      success: true,
      jobId: result.lastInsertRowid,
      message: 'Post queued for OnlyFans publishing',
      platform: 'onlyfans'
    };

  } catch (error) {
    console.error('Error queuing OnlyFans post:', error);
    throw new Error(`OnlyFans publishing failed: ${error.message}`);
  }
}

/**
 * Check the status of a scheduled post job.
 * @param {number} jobId - The job ID to check.
 */
function getJobStatus(jobId) {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    return job;
  } catch (error) {
    console.error('Error checking job status:', error);
    return null;
  }
}

/**
 * Get all pending jobs for monitoring.
 */
function getPendingJobs() {
  try {
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE status IN ('queued', 'running') 
      ORDER BY created_at ASC
    `).all();
    return jobs;
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    return [];
  }
}

module.exports = { 
  publishPost, 
  publishToOnlyFans, 
  getJobStatus, 
  getPendingJobs 
};
