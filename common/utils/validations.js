/**
 * validations.js
 *
 * Shared validation functions.
 */
module.exports = {
  isValidEmail: (email) => /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/.test(email),
  isNonEmptyString: (str) => typeof str === 'string' && str.trim().length > 0
};
