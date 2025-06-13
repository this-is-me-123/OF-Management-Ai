// require('dotenv').config();

// Diagnostic: Attempt to require puppeteer-core directly
try {
  const puppeteerCoreTest = require('puppeteer-core');
  console.log('[AutomationWorker] Successfully required puppeteer-core directly.');
} catch (e) {
  console.error('[AutomationWorker] CRITICAL: Failed to require puppeteer-core directly at the top of automationWorker.js. This indicates a fundamental module resolution problem.', e);
  process.exit(1);
}

const { getSupabaseClient } = require('./supabase_integration');
const supabase = getSupabaseClient();
const puppeteer = require('puppeteer-extra');
const { loginOnlyFans } = require('./proxy/puppeteerLogin');
const { sendDirectMessage } = require('./proxy/puppeteerActions');
const S = require('./selectors');

let globalBrowser = null;
let globalPage = null;

const POLLING_INTERVAL_MS = 10000;
const MAX_RETRIES = 3;

async function fetchPendingJobs() {
    const { data: jobs, error } = await supabase
        .from('automation_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
    if (error) {
        console.error('Error fetching pending jobs:', error.message);
        return [];
    }
    return jobs || [];
}

async function updateJobStatus(jobId, status, resultDetails = null) {
    const updates = { status, updated_at: new Date().toISOString() };
    if (status === 'processing') updates.attempts = supabase.sql('attempts + 1');
    if (resultDetails) updates.result_details = resultDetails;

    const { error } = await supabase
        .from('automation_jobs')
        .update(updates)
        .eq('id', jobId);
    if (error) console.error(`Error updating job ${jobId} to ${status}:`, error.message);
}

async function createOnlyFansPost({ mediaPath, caption }) {
    // Assumes globalPage is logged in
    await globalPage.waitForSelector(S.newPostButton);
    await globalPage.click(S.newPostButton);

    await globalPage.waitForSelector(S.mediaIcon);
    await globalPage.click(S.mediaIcon);
    await globalPage.waitForSelector(S.fileInput);
    const fileInput = await globalPage.$(S.fileInput);
    await fileInput.uploadFile(mediaPath);

    await globalPage.waitForSelector(S.captionField);
    await globalPage.click(S.captionField);
    await globalPage.keyboard.type(caption);

    await globalPage.waitForSelector(S.postButton);
    await globalPage.click(S.postButton);
    await globalPage.waitForResponse(r => r.url().includes('/api/posts') && r.status() === 200);
}

async function handleSendDm(job) {
    const { target_of_user_id, message_content } = job.job_payload;
    if (!globalPage || globalPage.isClosed()) {
        // Re-login logic
        const loginResult = await loginOnlyFans(
            process.env.ONLYFANS_USERNAME,
            process.env.ONLYFANS_PASSWORD,
            { headless: process.env.HEADLESS !== 'false' }
        );
        if (!loginResult.success) return { success: false, details: 'Re-login failed.' };
        globalBrowser = loginResult.browser;
        globalPage = loginResult.page;
    }

    try {
        const dmResult = await sendDirectMessage(globalPage, target_of_user_id, message_content);
        return dmResult.success
            ? { success: true, details: `DM sent to ${target_of_user_id}` }
            : { success: false, details: dmResult.error };
    } catch (e) {
        console.error('Critical error during sendDirectMessage:', e.message);
        return { success: false, details: e.message };
    }
}

async function processJob(job) {
    const attempt = job.attempts + 1;
    await supabase.from('automation_jobs').update({ status: 'processing', attempts: attempt, updated_at: new Date().toISOString() }).eq('id', job.id);
    let outcome;

    try {
        switch (job.job_type) {
            case 'send_dm':
                outcome = await handleSendDm(job);
                break;
            case 'create_post':
                await createOnlyFansPost(job.job_payload);
                outcome = { success: true };
                break;
            default:
                outcome = { success: false, details: `Unknown job type: ${job.job_type}` };
        }

        if (outcome.success) {
            await updateJobStatus(job.id, 'completed', outcome);
        } else if (attempt >= MAX_RETRIES) {
            await updateJobStatus(job.id, 'failed', outcome);
        } else {
            await updateJobStatus(job.id, 'pending', outcome);
        }
    } catch (e) {
        console.error(`Error processing job ${job.id}:`, e.message);
        await updateJobStatus(job.id, attempt >= MAX_RETRIES ? 'failed' : 'pending', { success: false, details: e.message });
    }
}

async function main() {
    if (!process.env.ONLYFANS_USERNAME || !process.env.ONLYFANS_PASSWORD) {
        console.error('Missing OnlyFans credentials.');
        process.exit(1);
    }

    const launchOpts = { headless: process.env.HEADLESS !== 'false' };
    const loginResult = await loginOnlyFans(
        process.env.ONLYFANS_USERNAME,
        process.env.ONLYFANS_PASSWORD,
        launchOpts
    );
    if (!loginResult.success) {
        console.error('Login failed:', loginResult.error);
        process.exit(1);
    }
    globalBrowser = loginResult.browser;
    globalPage = loginResult.page;

    while (true) {
        const jobs = await fetchPendingJobs();
        for (const job of jobs) await processJob(job);
        await new Promise(r => setTimeout(r, POLLING_INTERVAL_MS));
    }
}

process.on('SIGINT', async () => { console.log('Shutting down...'); if (globalBrowser) await globalBrowser.close(); process.exit(0); });
process.on('SIGTERM', async () => { console.log('Shutting down...'); if (globalBrowser) await globalBrowser.close(); process.exit(0); });

main().catch(async e => { console.error('Automation Worker crashed:', e); if (globalBrowser) await globalBrowser.close(); process.exit(1); });

