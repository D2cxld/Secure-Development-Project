// backend/utils/passwordValidator.js
const fs = require('fs');
const path = require('path');

// Load the blacklist once at startup
const passwordBlacklist = fs.readFileSync(
  path.join(__dirname, '../data/common-passwords.txt'),
  'utf-8'
).split('\n').map(p => p.trim().toLowerCase());

function validatePassword(password) {
  const errors = [];
  
  // Check length
  if (password.length < 8 || password.length > 64) {
    errors.push('Password must be between 8 and 64 characters');
  }
  
  // Check if all numbers
  if (/^\d+$/.test(password)) {
    errors.push('Password cannot be all numbers');
  }
  
  // Check blacklist
  if (passwordBlacklist.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validatePassword };