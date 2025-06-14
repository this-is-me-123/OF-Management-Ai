// publishService.js
// Simple service for posting content to OnlyFans or via automation.
// This stub logs posts and simulates an API call. In a real implementation,
// it would authenticate with the OnlyFans API or automation tool.

const axios = require('axios');
const config = require('./config/scheduler.config');

/**
 * Publish a post using the configured endpoint.
 * @param {Object} post - Post object containing content and metadata.
 */
async function publishPost(post) {
  // For now we just log the post and mimic an API call.
  try {
    console.log(`Publishing post to ${post?.platform}: ${post?.id ?? '<no-id>'}`);

    if (!post || !post.platform) {
      throw new Error('publishPost: missing required field "platform"');
    }
    switch (post.platform) {
      case 'hootsuite':
        return await axios.post(config.hootsuiteEndpoint, post);
      case 'onlyfans':
        throw new Error('OnlyFans publishing not yet implemented');
      default:
        throw new Error(`Unsupported platform: ${post.platform}`);
    }
  } catch (err) {
    console.error('Failed to publish post', err.message);
    throw err;
  }
}

module.exports = { publishPost };
