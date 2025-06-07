// Supabase client setup
const { createClient } = require('@supabase/supabase-js');

let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    // console.log('[SupabaseIntegration] Returning cached Supabase client instance.');
    return supabaseInstance;
  }

  // console.log('[SupabaseIntegration] Initializing new Supabase client instance...');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[SupabaseIntegration] CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_KEY is not defined! Ensure .env file is correctly set up and dotenv.config() has been called before getSupabaseClient().');
    // Return null or throw an error to indicate failure, allowing calling code to handle it.
    return null; 
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    // console.log('[SupabaseIntegration] Supabase client initialized successfully.');
  } catch (error) {
    console.error('[SupabaseIntegration] Error during createClient:', error);
    return null; // Return null on creation error
  }
  
  return supabaseInstance;
}

module.exports = {
  getSupabaseClient // Export the function
};
