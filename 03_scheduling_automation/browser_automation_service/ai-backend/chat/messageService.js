// Service to store and fetch messages via Supabase
const supabase = require('../supabase_integration');

async function insertMessage(message) {
  // TODO: Insert message into Supabase
}

async function fetchRecentMessages(limit = 10) {
  // TODO: Fetch messages from Supabase
}

module.exports = { insertMessage, fetchRecentMessages };
