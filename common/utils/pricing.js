// Utility for basic price calculations used in tests.
function calculatePrice(basePrice, discountRate = 0) {
  const price = basePrice * (1 - discountRate);
  return Math.round(price);
}

module.exports = { calculatePrice };
