/**
 * check_fine_tune_status.js
 *
 * Helper script to check the status of a fine-tuning job
 */
const OpenAI = require('openai');
const fs = require('fs');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkStatus(jobId) {
  try {
    const job = await openai.fineTuning.jobs.retrieve(jobId);
    
    console.log('=== Fine-Tuning Job Status ===');
    console.log('Job ID:', job.id);
    console.log('Status:', job.status);
    console.log('Model:', job.model);
    console.log('Created:', new Date(job.created_at * 1000).toISOString());
    
    if (job.finished_at) {
      console.log('Finished:', new Date(job.finished_at * 1000).toISOString());
    }
    
    if (job.fine_tuned_model) {
      console.log('Fine-tuned model:', job.fine_tuned_model);
      
      // Update job info file
      const jobInfo = {
        jobId: job.id,
        status: job.status,
        fineTunedModel: job.fine_tuned_model,
        completedAt: new Date().toISOString()
      };
      
      fs.writeFileSync('fine_tune_job.json', JSON.stringify(jobInfo, null, 2));
      console.log('\n✅ Model ready for use! Model ID saved to fine_tune_job.json');
    }
    
    if (job.error) {
      console.log('Error:', job.error);
    }
    
  } catch (error) {
    console.error('Error checking status:', error);
  }
}

// Get job ID from command line or job file
const jobId = process.argv[2];
if (jobId) {
  checkStatus(jobId);
} else {
  // Try to read from saved job file
  try {
    const jobInfo = JSON.parse(fs.readFileSync('fine_tune_job.json', 'utf8'));
    checkStatus(jobInfo.jobId);
  } catch (error) {
    console.log('Usage: node check_fine_tune_status.js <job_id>');
    console.log('Or run after fine_tune.js to automatically use saved job ID');
  }
}