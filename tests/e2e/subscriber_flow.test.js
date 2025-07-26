/**
 * subscriber_flow.test.js
 *
 * Simulates a new subscriber signing up and receiving messages.
 */
const axios = require('axios');
const assert = require('assert');

describe('Subscriber Flow', () => {
  it('should register, send welcome message, and record payment', async () => {
    // 1. Register
    const registerResp = await axios.post('http://localhost:3000/api/users', { email: 'test@example.com', password: 'password123' });
    assert.strictEqual(registerResp.status, 201);

    // 2. Check CRM sent welcome DM
    const dmLogs = await axios.get('http://localhost:3000/api/crm/logs');
    assert(dmLogs.data.some(log => log.message.includes('Welcome to')));

    // 3. Simulate payment
    const paymentResp = await axios.post('http://localhost:3000/api/payments', { amount: 19.99, subscriber_id: registerResp.data.id });
    assert.strictEqual(paymentResp.status, 200);
  });
});
