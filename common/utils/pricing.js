// Utility for basic price calculations used in tests.
// Returns price in *cents* to avoid FP rounding issues.
function calculatePrice(basePrice, discountRate = 0) {
  const basePriceCents = Math.round(basePrice * 100);
  const discountedCents = Math.round(basePriceCents * (1 - discountRate));
  return discountedCents; // caller can divide by 100 when displaying
}

module.exports = { calculatePrice };
