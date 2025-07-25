// Chat router handling chat endpoints
const express = require('express');
const router = express.Router();
const messageService = require('./messageService');
const openaiService = require('../openaiService'); // Updated to use the new OpenAI service
const { getSupabaseClient } = require('../supabase_integration');
const supabase = getSupabaseClient();

/**
 * Endpoint to send a message from a user and get an AI reply.
 * Expects req.body: { user_id: string, text: string, sender_type: 'user', conversation_id?: string }
 */
router.post('/send', async (req, res) => {
  const { user_id, text, conversation_id } = req.body;

  if (!user_id || !text) {
    return res.status(400).json({ error: 'Missing user_id or text in request body.' });
  }

  const userMessage = {
    user_id,
    text,
    sender_type: 'user',
    conversation_id
  };

  try {
    const savedUserMessage = await messageService.insertMessage(userMessage);
    if (!savedUserMessage) {
      // Return full error if available
      if (savedUserMessage && savedUserMessage._error) {
        return res.status(500).json({ error: 'Failed to save user message.', supabase: savedUserMessage });
      }
      return res.status(500).json({ error: 'Failed to save user message.' });
    }

    // Fetch recent messages for context (simple implementation)
    let conversationHistory = [];
    const recentMessages = await messageService.fetchRecentMessages({
      user_id: user_id,
      conversation_id: conversation_id,
      limit: 10 // Fetch last 10 messages for context
    });

    if (recentMessages && recentMessages.length > 0) {
      conversationHistory = recentMessages.map(msg => ({
        role: msg.sender_type === 'ai' ? 'assistant' : 'user',
        content: msg.text
      })).reverse(); // OpenAI expects chronological order, fetchRecentMessages returns newest first
    }

        // Construct messages for the new openaiService.generateChatCompletion
    // Filter out invalid historical messages
    const historyForAI = conversationHistory.filter(msg => typeof msg.content === 'string' && msg.content.trim().length > 0);
    // Always include the current user message
    const messagesForAI = [
      ...historyForAI,
      { role: 'user', content: text }
    ];

    const aiReplyText = await openaiService.generateChatCompletion(messagesForAI);


    if (!aiReplyText || aiReplyText.startsWith('Error:') || aiReplyText.startsWith('Sorry,')) {
        // Handle case where AI client returned an error message
        // We might choose not to save this as an AI message or save the error
        console.error('[ChatRouter] AI client returned an error or no reply:', aiReplyText);
        // Optionally, return a more generic error to the client
        // return res.status(500).json({ error: 'AI could not generate a response.' });
    }

    const aiMessage = {
      user_id, // AI message is still associated with the user's conversation context
      text: aiReplyText,
      sender_type: 'ai',
      conversation_id
    };

    const savedAiMessage = await messageService.insertMessage(aiMessage);
    if (!savedAiMessage) {
      // Log error, but might still return the AI reply if generated
      console.error('[ChatRouter] Failed to save AI message.');
    }

    // Always return both userMessage and aiMessage, even if AI reply errored
    res.status(201).json({
      userMessage: savedUserMessage,
      aiMessage: savedAiMessage || aiMessage || { error: 'No AI reply generated.' },
      debug: { messagesForAI, aiReplyText }
    });

  } catch (error) {
    console.error('[ChatRouter] Error in /send endpoint:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * Endpoint to fetch recent messages.
 * Expects query params: user_id (optional), conversation_id (optional), limit (optional, default 20)
 */
router.get('/receive', async (req, res) => {
  const { user_id, conversation_id } = req.query;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;

  if (isNaN(limit) || limit <= 0) {
    return res.status(400).json({ error: 'Invalid limit parameter.' });
  }

  try {
    const messages = await messageService.fetchRecentMessages({ user_id, conversation_id, limit });
    if (messages === null) { // Check for explicit null which messageService returns on error
      return res.status(500).json({ error: 'Failed to fetch messages.' });
    }
    res.json(messages);
  } catch (error) {
    console.error('[ChatRouter] Error in /receive endpoint:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * Endpoint to fetch recent messages for a user (optionally by conversation_id)
 * Expects req.body: { user_id: string, conversation_id?: string, limit?: number }
 */
router.post('/receive', async (req, res) => {
  const { user_id, conversation_id, limit } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id in request body.' });
  }
  try {
    // Build query for Supabase messages table
    let query = supabase
      .from('messages')
      .select('*')
      .eq('user_id', user_id);
    if (conversation_id) {
      query = query.eq('conversation_id', conversation_id);
    }
    query = query.order('created_at', { ascending: false });
    if (limit) {
      query = query.limit(limit);
    } else {
      query = query.limit(20); // default to 20
    }
    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch messages.', supabase: error });
    }
    return res.json({ messages: data });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

module.exports = router;
