// Service to store and fetch messages via Supabase
const { getSupabaseClient } = require('../supabase_integration');
const supabase = getSupabaseClient();

const MESSAGES_TABLE = 'messages';

/**
 * Inserts a message into the Supabase database.
 * @param {object} messageData - The message data to insert.
 * @param {string} messageData.user_id - The ID of the user associated with the message.
 * @param {string} messageData.text - The content of the message.
 * @param {'user' | 'ai'} messageData.sender_type - Who sent the message ('user' or 'ai').
 * @param {string} [messageData.conversation_id] - Optional ID to group messages in a conversation.
 * @returns {Promise<object|null>} The inserted message data or null if an error occurred.
 */
async function insertMessage(messageData) {
  if (!messageData || !messageData.user_id || !messageData.text || !messageData.sender_type) {
    console.error('[MessageService] Invalid message data for insert:', messageData);
    return null;
  }
  try {
    // Map backend fields to Supabase schema
    const mapped = {
      user_id: messageData.user_id, // must be a uuid string
      message: messageData.text, // backend 'text' -> 'message'
      role: messageData.sender_type // backend 'sender_type' -> 'role'
      // conversation_id is omitted since not in schema
    };
    const { data, error } = await supabase
      .from(MESSAGES_TABLE)
      .insert([mapped])
      .select(); // .select() returns the inserted rows

    if (error) {
      console.error('[MessageService] Error inserting message into Supabase:', error.message);
      // Attach error to returned object for debugging
      return { _error: true, message: error.message, details: error.details, code: error.code };
    }
    console.log('[MessageService] Message inserted successfully:', data && data[0]);
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('[MessageService] Exception during message insertion:', err.message);
    return null;
  }
}

/**
 * Fetches recent messages from Supabase.
 * @param {object} options - Options for fetching messages.
 * @param {string} [options.user_id] - Optional user ID to filter messages for a specific user.
 * @param {string} [options.conversation_id] - Optional conversation ID to filter messages.
 * @param {number} [options.limit=20] - The maximum number of messages to fetch.
 * @returns {Promise<Array<object>|null>} An array of messages or null if an error occurred.
 */
async function fetchRecentMessages({ user_id, conversation_id, limit = 20 } = {}) {
  try {
    let query = supabase
      .from(MESSAGES_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (conversation_id) {
      query = query.eq('conversation_id', conversation_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[MessageService] Error fetching messages from Supabase:', error.message);
      return null;
    }
    console.log(`[MessageService] Fetched ${data ? data.length : 0} messages.`);
    return data;
  } catch (err) {
    console.error('[MessageService] Exception during message fetching:', err.message);
    return null;
  }
}

module.exports = { insertMessage, fetchRecentMessages };
