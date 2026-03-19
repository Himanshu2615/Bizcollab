const { createClient } = require('redis');

let redisClient = null;

const initRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isDev = process.env.NODE_ENV !== 'production';
    
    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Fail fast in dev mode to reduce terminal noise
          if (isDev && retries > 3) return new Error('Local Redis not found');
          if (retries > 10) return new Error('Max retries reached');
          return Math.min(retries * 50, 500); 
        }
      }
    });

    client.on('error', (err) => {
      if (!isDev) console.error('Redis Error:', err.message);
    });

    await client.connect();
    console.log('[System] Redis connected successfully');
    redisClient = client;
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[System] Redis connection failed: ${err.message}. Using memory fallback.`);
    } else {
       // Quiter log for local dev environments
       console.log('[System] Redis unavailable (local development). Using memory fallback.');
    }
    redisClient = null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { initRedis, getRedisClient };
