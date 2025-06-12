// Utility for basic price calculations used in tests.
// Accepts the base price in **cents** and returns the discounted price in
// cents as well to avoid floating point precision issues.
function calculatePrice(basePriceCents, discountRate = 0) {
  const discounted = Math.round(basePriceCents * (1 - discountRate));
  return discounted; // caller can divide by 100 when displaying
}

module.exports = { calculatePrice };
