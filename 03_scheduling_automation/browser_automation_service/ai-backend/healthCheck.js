#!/usr/bin/env node

// Automated health-check harness for backend modules/endpoints
// Usage: node healthCheck.js (ensure server is running on port 8080 or set BASE_URL)

const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const endpoints = [
  '/chat',
  '/ads',
  '/analytics',
  '/crm',
  '/proxy',
  '/api/scheduler'
];

(async () => {
  console.log(`Health check starting at ${baseUrl}`);
  for (const path of endpoints) {
    try {
      const response = await fetch(baseUrl + path);
      const data = await response.json();
      console.log(`${path} -> ${response.status}`, data);
    } catch (err) {
      console.error(`${path} -> ERROR`, err.message);
    }
  }
  // POST endpoint tests
  console.log('\nPOST endpoint tests:');
  const testUserId = process.env.TEST_USER_ID || '20c8dfbe-1988-4736-81eb-f3b86ac6fc6c';
  // Test chat/send
  try {
    const resp = await fetch(baseUrl + '/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: testUserId, text: 'Health check test' })
    });
    const body = await resp.json();
    console.log('/chat/send ->', resp.status, body);
  } catch (err) {
    console.error('/chat/send -> ERROR', err.message);
  }
  // Test chat/receive
  try {
    const resp2 = await fetch(baseUrl + '/chat/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: testUserId })
    });
    const body2 = await resp2.json();
    console.log('/chat/receive ->', resp2.status, body2);
  } catch (err) {
    console.error('/chat/receive -> ERROR', err.message);
  }
})();
