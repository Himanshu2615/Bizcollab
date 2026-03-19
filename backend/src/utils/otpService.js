const crypto = require('crypto');
const NodeCache = require('node-cache');
const { getRedisClient } = require('../setup/redis');

// Fallback in-memory cache if Redis is down
const localCache = new NodeCache({ stdTTL: 600 }); // 10 minutes

/**
 * Generates a cryptographically secure 6-digit numeric OTP.
 * @returns {string} 6-digit OTP string.
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes an OTP using SHA256.
 * @param {string} otp The plain-text OTP.
 * @returns {string} The hashed OTP.
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Stores the hashed OTP in Redis or local cache.
 * @param {string} userId The MongoDB user ID.
 * @param {string} hashedOtp The hashed OTP.
 */
const storeOTP = async (userId, hashedOtp) => {
  const client = getRedisClient();
  const key = `otp:${userId}`;
  
  if (client) {
    await client.set(key, hashedOtp, { EX: 600 });
  } else {
    console.warn('Redis not available, using memory cache for OTP');
    localCache.set(key, hashedOtp);
  }
};

/**
 * Retrieves the hashed OTP from Redis or local cache.
 * @param {string} userId The MongoDB user ID.
 * @returns {Promise<string|null>} The hashed OTP or null if expired/not found.
 */
const getHashedOTP = async (userId) => {
  const client = getRedisClient();
  const key = `otp:${userId}`;
  
  if (client) {
    return await client.get(key);
  } else {
    return localCache.get(key);
  }
};

/**
 * Deletes the OTP key.
 * @param {string} userId The MongoDB user ID.
 */
const deleteOTP = async (userId) => {
  const client = getRedisClient();
  const key = `otp:${userId}`;
  
  if (client) {
    await client.del(key);
  } else {
    localCache.del(key);
  }
};

module.exports = {
  generateOTP,
  hashOTP,
  storeOTP,
  getHashedOTP,
  deleteOTP,
};
