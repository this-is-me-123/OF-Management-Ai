/**
 * test_price_calculation.js
 *
 * Unit test for pricing calculation function.
 */
const assert = require('assert');
const { calculatePrice } = require('../../common/utils/pricing');

describe('Price Calculation', () => {
  it('should apply tier discount correctly', () => {
    const result = calculatePrice(100, 0.2); // 20% discount
    assert.strictEqual(result, 80);
  });
});
