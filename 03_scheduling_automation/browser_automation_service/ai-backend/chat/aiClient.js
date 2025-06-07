// AI engine wrapper (GPT-4/Claude)
const axios = require('axios');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo'; // Or your preferred model, e.g., gpt-4

module.exports = {
  /**
   * Generates an AI reply using OpenAI's Chat Completions API.
   * @param {string} userMessage - The user's message.
   * @param {Array<object>} [conversationHistory=[]] - Optional array of previous messages in the format { role: 'user'|'assistant', content: string }.
   * @returns {Promise<string|null>} The AI's reply text or null if an error occurred.
   */
  generateReply: async (userMessage, conversationHistory = []) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[AIClient] OPENAI_API_KEY is not set.');
      return 'Error: OpenAI API key not configured.'; // Return a user-facing error or null
    }

    const messages = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await axios.post(
        OPENAI_API_URL,
        {
          model: OPENAI_MODEL,
          messages: messages,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const aiReply = response.data.choices[0].message.content.trim();
        console.log('[AIClient] AI Reply:', aiReply);
        return aiReply;
      } else {
        console.error('[AIClient] No reply in OpenAI response:', response.data);
        return 'Sorry, I could not generate a reply at this moment.';
      }
    } catch (error) {
      if (error.response) {
        console.error('[AIClient] Error calling OpenAI API:', error.response.status, error.response.data);
      } else {
        console.error('[AIClient] Error setting up OpenAI request:', error.message);
      }
      return 'Sorry, there was an error communicating with the AI service.';
    }
  }
};
