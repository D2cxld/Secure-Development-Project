const db = require('./dbConfig');
const crypto = require('crypto');

/**
 * Secure 2FA code management system using PostgreSQL instead of global variable
 * Stores codes in the database with expiration times
 */
const twoFAManager = {
  /**
   * Generate a 6-digit verification code
   * @returns {string} A 6-digit code
   */
  generateCode() {
    // Generate a random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Store a 2FA code for a user with expiration
   * @param {string} username - The username 
   * @param {string} email - The user's email
   * @param {string} code - The 6-digit verification code
   * @param {object} userData - Optional user data to store during registration
   * @returns {Promise} Result of the database operation
   */
  async storeCode(username, email, code, userData = null) {
    try {
      // Check if there's an existing code for this username
      const existingCode = await db.query(
        'SELECT id FROM temp_admin_registration WHERE username = $1 OR email = $2',
        [username, email]
      );

      // If there's an existing entry, update it
      if (existingCode.rows.length > 0) {
        return await db.query(
          'UPDATE temp_admin_registration SET verification_code = $1, expires_at = NOW() + INTERVAL \'10 minutes\' WHERE username = $2 OR email = $3',
          [code, username, email]
        );
      }

      // If this is a new registration with user data
      if (userData) {
        const { first_name, surname, password_hash } = userData;
        return await db.query(
          'INSERT INTO temp_admin_registration (username, email, password_hash, first_name, surname, verification_code, expires_at) VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL \'10 minutes\')',
          [username, email, password_hash, first_name, surname, code]
        );
      }

      // Simple code storage for existing users
      return await db.query(
        'INSERT INTO temp_admin_registration (username, email, verification_code, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'10 minutes\')',
        [username, email, code]
      );
    } catch (error) {
      console.error('❌ Failed to store 2FA code:', error);
      throw error;
    }
  },

  /**
   * Verify a 2FA code for a user
   * @param {string} username - The username
   * @param {string} code - The code to verify
   * @returns {Promise<boolean>} True if code matches and is not expired
   */
  async verifyCode(username, code) {
    try {
      const result = await db.query(
        'SELECT * FROM temp_admin_registration WHERE username = $1 AND verification_code = $2 AND expires_at > NOW()',
        [username, code]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Failed to verify 2FA code:', error);
      return false;
    }
  },

  /**
   * Get temporary admin registration data
   * @param {string} username - The username
   * @returns {Promise<Object>} Admin registration data
   */
  async getRegistrationData(username) {
    try {
      const result = await db.query(
        'SELECT username, email, password_hash, first_name, surname FROM temp_admin_registration WHERE username = $1 AND expires_at > NOW()',
        [username]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ Failed to get registration data:', error);
      return null;
    }
  },

  /**
   * Delete temporary registration data after successful verification
   * @param {string} username - The username
   * @returns {Promise} Result of the database operation
   */
  async deleteTemporaryData(username) {
    try {
      return await db.query(
        'DELETE FROM temp_admin_registration WHERE username = $1',
        [username]
      );
    } catch (error) {
      console.error('❌ Failed to delete temporary data:', error);
      throw error;
    }
  }
};

module.exports = twoFAManager;