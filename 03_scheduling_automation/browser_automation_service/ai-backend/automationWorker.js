require('dotenv').config();

// Diagnostic: Attempt to require puppeteer-core directly
try {
  const puppeteerCoreTest = require('puppeteer-core');
  console.log('[AutomationWorker] Successfully required puppeteer-core directly.');
  // console.log('[AutomationWorker] puppeteer-core path:', require.resolve('puppeteer-core'));
} catch (e) {
  console.error('[AutomationWorker] CRITICAL: Failed to require puppeteer-core directly at the top of automationWorker.js. This indicates a fundamental module resolution problem.', e);
  process.exit(1); // Exit if this basic require fails
}

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getSupabaseClient } = require('./supabase_integration');

const supabase = getSupabaseClient();
const puppeteer = require('puppeteer-extra'); // puppeteer-extra
const { loginOnlyFans, checkLoginStatus, getBrowserPage } = require('./proxy/puppeteerLogin');
const { sendDirectMessage } = require('./proxy/puppeteerActions');

let globalBrowser = null;
let globalPage = null;

const POLLING_INTERVAL_MS = 10000; // Poll every 10 seconds
const MAX_RETRIES = 3;

async function fetchPendingJobs() {
    console.log('Fetching pending automation jobs...');
    const { data: jobs, error } = await supabase
        .from('automation_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching pending jobs:', error.message);
        return [];
    }
    if (jobs && jobs.length > 0) {
        console.log(`Found ${jobs.length} pending jobs.`);
    }
    return jobs || [];
}

async function updateJobStatus(jobId, status, resultDetails = null) {
    const { error } = await supabase
        .from('automation_jobs')
        .update({ 
            status: status, 
            result_details: resultDetails,
            updated_at: new Date().toISOString(),
            ...(status === 'processing' && { attempts: supabase.sql('attempts + 1') })
        })
        .eq('id', jobId);

    if (error) {
        console.error(`Error updating job ${jobId} to status ${status}:`, error.message);
    } else {
        console.log(`Job ${jobId} status updated to ${status}.`);
    }
}

async function handleSendDm(job) {
    console.log(`  [JOB_HANDLER] Processing send_dm job ${job.id} for OF user: ${job.job_payload.target_of_user_id}`);
    const { target_of_user_id, message_content } = job.job_payload;

    if (!globalPage || globalPage.isClosed()) {
        console.error('  [JOB_HANDLER] Global page is not available or closed. Attempting to re-login/re-initialize.');
        // Attempt to re-initialize. This is a simple recovery, might need more robust handling.
        const loginResult = await loginOnlyFans({ existingBrowser: globalBrowser, headless: process.env.HEADLESS !== 'false' });
        if (!loginResult.success || !loginResult.page) {
            console.error('  [JOB_HANDLER] Failed to re-initialize Puppeteer page. Skipping job.');
            return { success: false, details: 'Failed to re-initialize Puppeteer page.' };
        }
        globalBrowser = loginResult.browser;
        globalPage = loginResult.page;
        console.log('  [JOB_HANDLER] Re-initialized Puppeteer page successfully.');
    }

    try {
        // Call the imported sendDirectMessage function
        const dmResult = await sendDirectMessage(globalPage, target_of_user_id, message_content);

        if (dmResult.success) {
            console.log(`  [JOB_HANDLER] Successfully sent DM to ${target_of_user_id} via puppeteerActions.`);
            return { success: true, details: `Successfully sent DM to ${target_of_user_id}.` };
        } else {
            console.error(`  [JOB_HANDLER] Failed to send DM to ${target_of_user_id} via puppeteerActions: ${dmResult.error}`);
            return { success: false, details: `Failed to send DM via puppeteerActions: ${dmResult.error}` };
        }

    } catch (error) {
        // This catch block might be redundant if sendDirectMessage handles its own errors thoroughly
        // and returns a structured error. However, it can catch unexpected errors from the call itself.
        console.error(`  [JOB_HANDLER] Critical error calling sendDirectMessage for ${target_of_user_id}:`, error.message);
        return { success: false, details: `Critical error during sendDirectMessage call: ${error.message}` };
    }
}

async function processJob(job) {
    console.log(`Processing job ${job.id} (Type: ${job.job_type}, Attempt: ${job.attempts + 1})`); // Log attempt as current attempt
    // Increment attempt count when we start processing (or re-processing)
    // The initial fetch gets jobs with status 'pending'. We update to 'processing' and increment attempts.
    // If it was already 'processing' due to a previous crash, this logic still holds.
    const currentAttempt = job.attempts + 1;
    await supabase
        .from('automation_jobs')
        .update({ status: 'processing', attempts: currentAttempt, updated_at: new Date().toISOString() })
        .eq('id', job.id);

    let jobOutcome;
    try {
        switch (job.job_type) {
            case 'send_dm':
                jobOutcome = await handleSendDm(job);
                break;
            default:
                console.warn(`  Unknown job type: ${job.job_type} for job ${job.id}.`);
                jobOutcome = { success: false, details: `Unknown job type: ${job.job_type}` };
        }

        if (jobOutcome.success) {
            console.log(`  Job ${job.id} completed successfully.`);
            await updateJobStatus(job.id, 'completed', jobOutcome);
        } else {
            console.error(`  Job ${job.id} (Attempt: ${currentAttempt}) failed: ${jobOutcome.details}`);
            if (currentAttempt >= MAX_RETRIES) {
                console.warn(`  Job ${job.id} reached max retries (${currentAttempt}). Marking as permanently failed.`);
                await updateJobStatus(job.id, 'failed', jobOutcome);
            } else {
                console.log(`  Job ${job.id} failed on attempt ${currentAttempt} of ${MAX_RETRIES}. Marking as 'pending' for retry.`);
                // Update status to 'pending' to allow re-processing, keep details of this failure.
                await updateJobStatus(job.id, 'pending', { ...jobOutcome, note: `Failed on attempt ${currentAttempt}. Will retry.` });
            }
        }
    } catch (error) {
        console.error(`  Critical error processing job ${job.id} (Attempt: ${currentAttempt}):`, error.message);
        // Also check retries for critical errors
        if (currentAttempt >= MAX_RETRIES) {
            await updateJobStatus(job.id, 'failed', { success: false, details: `Critical error: ${error.message} on max attempts.` });
        } else {
            await updateJobStatus(job.id, 'failed', { success: false, details: `Critical error: ${error.message} on attempt ${currentAttempt}.` });
        }
    }
}

async function main() {
    console.log('Starting Automation Worker...');

    console.log('Initializing Puppeteer and logging into OnlyFans...');
    const loginResult = await loginOnlyFans({ headless: process.env.HEADLESS !== 'false' }); // Launch new browser

    if (!loginResult.success || !loginResult.browser || !loginResult.page) {
        console.error('Failed to initialize Puppeteer and log in to OnlyFans. Worker cannot start.');
        console.error('Error details:', loginResult.error);
        if (loginResult.browser) {
            await loginResult.browser.close();
        }
        process.exit(1);
    }
    globalBrowser = loginResult.browser;
    globalPage = loginResult.page;
    console.log('Successfully logged into OnlyFans with Puppeteer.');

    // Main loop
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const jobs = await fetchPendingJobs();
        if (jobs.length === 0) {
            // console.log('No pending jobs. Waiting...');
        } else {
            for (const job of jobs) {
                await processJob(job);
            }
        }
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL_MS));
    }

    // TODO: Graceful shutdown for Puppeteer browser instance
}

async function gracefulShutdown() {
    console.log('\nGracefully shutting down automation worker...');
    if (globalBrowser) {
        console.log('Closing Puppeteer browser...');
        try {
            await globalBrowser.close();
            console.log('Puppeteer browser closed.');
        } catch (e) {
            console.error('Error closing Puppeteer browser:', e.message);
        }
    }
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

main().catch(async error => {
    console.error('Automation Worker crashed:', error);
    await gracefulShutdown(); // Attempt to close browser even on crash
    process.exit(1);
});
