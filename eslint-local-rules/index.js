/**
 * Local ESLint plugin
 */

module.exports = {
  rules: {
    'no-inline-type-imports': require('./no-inline-type-imports'),
    'merge-duplicate-imports': require('./merge-duplicate-imports'),
  },
};
