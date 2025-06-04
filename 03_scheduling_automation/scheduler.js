/**
 * scheduler.js
 *
 * Core logic: reads scheduled items from DB and publishes them.
 */
const cron = require('node-cron');
const config = require('./config/scheduler.config');
const { publishPost } = require('./publishService');

// Run every minute to check for new posts to publish
cron.schedule('* * * * *', async () => {
  const duePosts = await getDuePosts();
  for (const post of duePosts) {
    await publishPost(post);
  }
});

console.log('Scheduler started per config:', config);

async function getDuePosts() {
  // stub: query database for posts where publish_time <= now
  return [];
}
