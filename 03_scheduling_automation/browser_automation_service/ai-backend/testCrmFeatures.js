const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Ensures .env is loaded from the current script's directory (ai-backend)

const { getSupabaseClient } = require('./supabase_integration'); // Import the getter function
const { segmentUsers, runTriggers } = require('./crm/crmService');

async function testCrm() {
  console.log('Starting CRM services test...');

  const supabase = getSupabaseClient(); // Get the client instance

  if (!supabase) {
    console.error('[TestCrmFeatures] Failed to initialize Supabase client. Check supabase_integration.js, .env variables, and previous logs.');
    return;
  }

  // Test User Segmentation
  try {
    console.log('\n[Test] Running User Segmentation...');
    const segments = await segmentUsers(supabase);
    console.log('[Test] User Segmentation Results:', JSON.stringify(segments, null, 2));
  } catch (error) {
    console.error('[Test] Error during user segmentation:', error.message);
  }

  // Test CRM Triggers
  try {
    console.log('\n[Test] Running CRM Triggers...');
    await runTriggers(supabase);
    console.log('[Test] CRM Triggers completed.');
  } catch (error) {
    console.error('[Test] Error during CRM trigger processing:', error.message);
  }

  console.log('\nCRM services test finished.');
}

testCrm().catch(error => {
  console.error('Unhandled error in testCrm:', error);
});
