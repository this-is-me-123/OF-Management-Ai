const fetch = require('node-fetch');

async function testSchedulerDM() {
  const resp = await fetch('http://localhost:3000/api/scheduler/dm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.SCHEDULER_API_KEY || 'your_api_key_here'
    },
    body: JSON.stringify({
      targetOfUserId: 'testuser4',
      messageTemplateId: 'template1',
      username: 'testuser4',
      sourceUserId: 'admin'
    })
  });
  const data = await resp.json();
  console.log('Scheduler DM response:', data);
}

testSchedulerDM();
