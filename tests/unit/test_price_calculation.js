/**
 * test_price_calculation.js
 *
 * Basic script to verify the pricing utility works.
 */
const assert = require('assert');
const { calculatePrice } = require('../../common/utils/pricing');

try {
  const result = calculatePrice(100, 0.2); // 20% discount
  assert.strictEqual(result, 80);
  console.log('Price calculation test passed');
} catch (err) {
  console.error('Price calculation test failed:', err.message);
  process.exit(1);
}
