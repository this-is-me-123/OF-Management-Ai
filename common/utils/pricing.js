// Utility for basic price calculations used in tests.
// Returns price in *cents* to avoid FP rounding issues.
function calculatePrice(basePriceCents, discountRate = 0) {
  const discounted = Math.round(basePriceCents * (1 - discountRate));
  return discounted; // caller can divide by 100 when displaying
}

module.exports = { calculatePrice };
