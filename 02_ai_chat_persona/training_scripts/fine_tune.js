/**
 * fine_tune.js
 *
 * Uses OpenAI API to fine-tune a model on DM conversation data.
 */
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createTrainingData() {
  // Read the cleaned DM archive
  const dmData = JSON.parse(fs.readFileSync('../full_dm_archive_cleaned.json', 'utf8'));
  
  // Convert to OpenAI fine-tuning format (JSONL)
  const trainingLines = dmData.messages.map(msg => {
    return JSON.stringify({
      messages: [
        { role: "system", content: "You are a flirty, engaging OnlyFans creator who connects authentically with subscribers while maintaining professional boundaries. Be warm, playful, and suggest premium content when appropriate." },
        { role: "user", content: msg.inbound },
        { role: "assistant", content: msg.response }
      ]
    });
  });
  
  // Write to JSONL file
  const trainingFile = path.join(__dirname, 'training_data.jsonl');
  fs.writeFileSync(trainingFile, trainingLines.join('\n'));
  
  console.log(`Created training file: ${trainingFile} with ${trainingLines.length} examples`);
  return trainingFile;
}

async function uploadTrainingFile(filePath) {
  console.log('Uploading training file to OpenAI...');
  
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: 'fine-tune'
  });
  
  console.log('Uploaded file:', file.id);
  return file.id;
}

async function createFineTuneJob(fileId) {
  console.log('Creating fine-tune job...');
  
  const fineTune = await openai.fineTuning.jobs.create({
    training_file: fileId,
    model: 'gpt-3.5-turbo-1106',
    suffix: 'of-persona-v1'
  });
  
  console.log('Fine-tune job created:', fineTune.id);
  return fineTune;
}

async function checkJobStatus(jobId) {
  const job = await openai.fineTuning.jobs.retrieve(jobId);
  console.log(`Job ${jobId} status: ${job.status}`);
  
  if (job.status === 'succeeded') {
    console.log('Fine-tuned model:', job.fine_tuned_model);
    return job.fine_tuned_model;
  } else if (job.status === 'failed') {
    console.log('Job failed:', job.error);
    return null;
  }
  
  return 'in_progress';
}

async function runFineTune() {
  try {
    // Step 1: Create training data
    const trainingFile = await createTrainingData();
    
    // Step 2: Upload to OpenAI
    const fileId = await uploadTrainingFile(trainingFile);
    
    // Step 3: Start fine-tuning
    const fineTuneJob = await createFineTuneJob(fileId);
    
    console.log('\nFine-tuning started! Job ID:', fineTuneJob.id);
    console.log('Check status with: node check_fine_tune_status.js', fineTuneJob.id);
    
    // Save job details
    const jobInfo = {
      jobId: fineTuneJob.id,
      fileId: fileId,
      startTime: new Date().toISOString(),
      status: 'started'
    };
    
    fs.writeFileSync('fine_tune_job.json', JSON.stringify(jobInfo, null, 2));
    
  } catch (error) {
    console.error('Error in fine-tuning process:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runFineTune();
}

module.exports = { runFineTune, checkJobStatus };
