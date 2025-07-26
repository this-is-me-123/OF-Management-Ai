/**
 * scheduler.config.js
 *
 * Contains default settings for the scheduler.
 */
module.exports = {
  timezone: 'America/New_York',
  defaultPublishWindow: {
    startHour: 9,
    endHour: 21
  },
  retryAttempts: 3,
  hootsuiteEndpoint: 'https://api.hootsuite.com/v1/messages',
  batchSize: 10
};
