const express = require('express');
const router = express.Router();
const { getSupabaseClient } = require('./supabase_integration');

// Health check endpoint for /api/scheduler
router.get('/', (req, res) => {
  res.json({ status: 'scheduler module active' });
});

// POST /api/scheduler/dm - Schedule a new Direct Message
router.post('/dm', async (req, res, next) => {
  // --- API Key Authentication ---
  const apiKey = req.headers['x-api-key']; // Standard header for API keys
  const expectedApiKey = process.env.SCHEDULER_API_KEY;

  if (!expectedApiKey) {
    console.error('[API /scheduler/dm] CRITICAL: SCHEDULER_API_KEY is not set in environment variables. Denying all requests.');
    // This is a server configuration error, so return 500
    return res.status(500).json({ success: false, error: 'Internal Server Error: API authentication is not configured.' });
  }

  if (!apiKey) {
    console.warn('[API /scheduler/dm] Missing API key (X-API-Key header).');
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing API key.' });
  }

  if (apiKey !== expectedApiKey) {
    console.warn('[API /scheduler/dm] Invalid API key provided.');
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid API key.' });
  }

  console.log('[API /scheduler/dm] Received request to schedule DM:', req.body);
  const { targetOfUserId, messageTemplateId, username, sourceUserId } = req.body;

  // === Content Generation Integration ===
  const { triggerContentGeneration, getLatestAsset } = require('./utils/contentGeneration');
  let genResult, latestAsset;
  try {
    genResult = await triggerContentGeneration();
    latestAsset = getLatestAsset();
    console.log('[API /scheduler/dm] Generated asset:', latestAsset);
    if (latestAsset && latestAsset.image_path) {
      req.body.asset_path = latestAsset.image_path;
      console.log(`[DELIVERY] Scheduled DM/post for ${username} with asset: ${latestAsset.image_path}`);
    }
  } catch (e) {
    console.error('[API /scheduler/dm] Content generation failed:', e);
  }

  // Basic validation
  // --- Basic Presence Validation ---
  if (!targetOfUserId || !messageTemplateId || !username) {
    console.warn('[API /scheduler/dm] Missing required fields:', { targetOfUserId, messageTemplateId, username });
    return res.status(400).json({ success: false, error: 'Missing required fields: targetOfUserId, messageTemplateId, username are required.' });
  }

  // --- Type and Format Validation ---
  if (typeof targetOfUserId !== 'string' || typeof messageTemplateId !== 'string' || typeof username !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid input types: targetOfUserId, messageTemplateId, and username must be strings.' });
  }

  if (sourceUserId && (typeof sourceUserId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(sourceUserId))) {
    return res.status(400).json({ success: false, error: 'Invalid sourceUserId format: If provided, sourceUserId must be a valid UUID.' });
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('[API /scheduler/dm] Supabase client not initialized.');
    return res.status(500).json({ success: false, error: 'Internal server error: Supabase client not available.' });
  }

  // --- Database Validation for messageTemplateId ---
  try {
    const { data: templateData, error: templateError } = await supabase
      .from('message_templates')
      .select('template_name, status')
      .eq('template_name', messageTemplateId)
      .single(); // Expecting a single template by name

    if (templateError) {
      console.error(`[API /scheduler/dm] Error fetching template '${messageTemplateId}':`, templateError.message);
      // If error is due to 'PGRST116' (0 rows), it means template not found
      if (templateError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: `Message template '${messageTemplateId}' not found.` });
      }
      return res.status(500).json({ success: false, error: 'Error validating message template.', details: templateError.message });
    }

    if (!templateData) { // Should be caught by PGRST116, but as a fallback
      return res.status(404).json({ success: false, error: `Message template '${messageTemplateId}' not found.` });
    }

    if (templateData.status !== 'active') {
      return res.status(400).json({ success: false, error: `Message template '${messageTemplateId}' is not active.` });
    }
  } catch (dbError) {
    console.error('[API /scheduler/dm] Unexpected database error during template validation:', dbError.message);
    return res.status(500).json({ success: false, error: 'Internal server error during template validation.' });
  }

  const actionDetails = {
    message_template_id: messageTemplateId,
    username: username,
    of_user_id: targetOfUserId
  };

  try {
    const { data: crmAction, error: insertError } = await supabase
      .from('crm_actions')
      .insert({
        trigger_type: 'api_scheduled_dm', // New trigger type for API scheduled DMs
        status: 'pending',                // Default status for new actions
        user_id: sourceUserId || null,    // Optional: ID of the user in your system initiating this
        action_details: actionDetails,
        created_at: new Date().toISOString(),
        // processed_at will be set by crmActionProcessor
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API /scheduler/dm] Error inserting CRM action into Supabase:', insertError.message);
      return res.status(500).json({ success: false, error: 'Failed to schedule DM.', details: insertError.message });
    }

    console.log('[API /scheduler/dm] Successfully created CRM action:', crmAction);
    res.status(201).json({ success: true, message: 'DM scheduled successfully.', crm_action_id: crmAction.id });

  } catch (error) {
    console.error('[API /scheduler/dm] Unexpected error:', error.message);
    next(error); // Pass to global error handler
  }
});

module.exports = router;
