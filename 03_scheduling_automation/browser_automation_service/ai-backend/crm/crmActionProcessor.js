const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Ensures .env is loaded from ai-backend directory

const { getSupabaseClient } = require('../supabase_integration'); // Assuming supabase_integration.js is in ai-backend

const ACTION_PROCESSING_BATCH_SIZE = 10; // Process up to 10 actions at a time
const POLLING_INTERVAL_MS = 30000; // Poll for new actions every 30 seconds

async function processPendingActions(supabaseClient) {
  console.log('Starting CRM Action Processor...');

  try {
    // 1. Fetch pending actions
    const { data: pendingActions, error: fetchError } = await supabaseClient
      .from('crm_actions')
      .select('*')
      .eq('status', 'pending')
      .limit(ACTION_PROCESSING_BATCH_SIZE);

    if (fetchError) {
      console.error('Error fetching pending CRM actions:', fetchError.message);
      return;
    }

    if (!pendingActions || pendingActions.length === 0) {
      console.log('No pending CRM actions to process.');
      return;
    }

    console.log(`Found ${pendingActions.length} pending actions to process.`);

    for (const action of pendingActions) {
      console.log(`\nProcessing action ID: ${action.id}, Type: ${action.trigger_type}, User ID: ${action.user_id}`);

      // 2. Mark action as 'processing'
      const { error: updateToProcessingError } = await supabaseClient
        .from('crm_actions')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', action.id);

      if (updateToProcessingError) {
        console.error(`  Failed to update action ${action.id} to 'processing':`, updateToProcessingError.message);
        continue; // Skip to next action
      }

      let actionSuccess = false;
      try {
        const result = await executeAction(supabaseClient, action);
        actionSuccess = result.success;
      } catch (executionError) {
        console.error(`  Error during execution of action ${action.id}:`, executionError.message);
        actionSuccess = false;
      }

      // 4. Update action status to 'completed' or 'failed'
      const finalStatus = actionSuccess ? 'completed' : 'failed';
      const { error: updateToFinalStatusError } = await supabaseClient
        .from('crm_actions')
        .update({
          status: finalStatus,
          processed_at: new Date().toISOString() // Update processed_at again
        })
        .eq('id', action.id);

      if (updateToFinalStatusError) {
        console.error(`  Failed to update action ${action.id} to '${finalStatus}':`, updateToFinalStatusError.message);
      }
      console.log(`  Action ${action.id} marked as ${finalStatus}.`);
    }

  } catch (error) {
    console.error('An unexpected error occurred in the CRM Action Processor:', error.message);
  }

  console.log('\nCRM Action Processor finished a cycle.');
}

async function executeAction(supabase, action) {
  // This console.log was already present in processPendingActions, so removed from here to avoid duplication.
  // console.log(`Processing action ID: ${action.id}, Type: ${action.trigger_type}, User ID: ${action.user_id}`);

  let job_type = null;
  let job_payload = {};

  switch (action.trigger_type) {
    case 'api_scheduled_dm': // Added to handle DMs scheduled via API
    case 'new_user_welcome':
    case 'first_message_follow_up':
    case 'inactive_user_reengagement':
    case 'subscription_anniversary_1m':
      job_type = 'send_dm';
      const templateName = action.action_details?.message_template_id;
      const username = action.action_details?.username;
      const targetOfUserId = action.action_details?.of_user_id;

      if (!templateName) {
        console.warn(`  Missing message_template_id for send_dm action ${action.id}. Marking as failed.`);
        return { success: false, details: 'Missing message_template_id for send_dm action.' };
      }

      // Fetch message template from DB
      const { data: templateData, error: templateError } = await supabase
        .from('message_templates')
        .select('content')
        .eq('template_name', templateName)
        .eq('status', 'active')
        .single();

      if (templateError || !templateData) {
        console.error(`  Error fetching active template '${templateName}' for action ${action.id}:`, templateError?.message || 'Template not found or not active.');
        return { success: false, details: `Failed to fetch or find active template '${templateName}'.` };
      }

      let messageContent = templateData.content;
      // Basic placeholder replacement
      if (username) {
        messageContent = messageContent.replace(/{{username}}/g, username);
      }
      // Add more placeholder replacements here if needed, e.g., {{link}}, {{promo_code}}

      job_payload = {
        target_of_user_id: targetOfUserId,
        username: username, // Keep username for logging or other worker needs
        message_content: messageContent,
        // source_user_id: action.user_id // Optional for internal tracking
      };
      console.log(`  Preparing '${job_type}' job for user ${action.user_id} (OF_ID: ${targetOfUserId}) using template '${templateName}'.`);
      break;
    // case 'example_trigger_type': // Keep for future reference if other job types are needed
    //   console.log(`  SIMULATING: Handling example trigger for user ${action.user_id}`);
    //   return { success: true, details: 'Simulated example action handled.' };
    default:
      console.warn(`  Unknown or unhandled trigger type for automation job: ${action.trigger_type}. Marking CRM action as failed.`);
      return { success: false, details: `Unknown or unhandled trigger type for automation: ${action.trigger_type}` };
  }

  if (job_type) {
    const { data: newJob, error: jobError } = await supabase
      .from('automation_jobs')
      .insert({
        crm_action_id: action.id,
        job_type: job_type,
        job_payload: job_payload,
        // status defaults to 'pending'
      })
      .select('id');

    if (jobError) {
      console.error(`    Failed to create automation job for CRM action ${action.id}:`, jobError.message);
      return { success: false, details: `Failed to create automation job: ${jobError.message}` };
    } else {
      console.log(`    Successfully created automation job (ID: ${newJob[0]?.id}) for CRM action ${action.id}.`);
      return { success: true, details: `Automation job ${newJob[0]?.id} created.` };
    }
  } else {
    // Should not happen if switch case is exhaustive for actions that need jobs
    console.warn(`  No job_type defined for CRM action ${action.id}, trigger_type ${action.trigger_type}. This might be an oversight.`);
    return { success: false, details: 'No automation job type defined for this CRM action.' };
  }
}

// --- Main execution ---
async function main() {
  const supabase = getSupabaseClient(); // Get the client instance
  if (!supabase) {
    console.error('Failed to initialize Supabase client. Check supabase_integration.js and .env file, and previous logs.');
    return;
  }
  console.log(`CRM Action Processor will poll for new actions every ${POLLING_INTERVAL_MS / 1000} seconds.`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processPendingActions(supabase);
    } catch (error) {
      console.error('Error in processing cycle:', error.message, 'Continuing to next cycle after delay.');
      // Potentially add more robust error handling here, e.g., if Supabase client becomes invalid
    }
    console.log(`Waiting for ${POLLING_INTERVAL_MS / 1000} seconds before next poll...`);
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
  }
}

main().catch(error => {
  console.error('Critical error in main execution:', error);
  process.exit(1);
});
