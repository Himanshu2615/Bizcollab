const { createClient } = require('redis');

let redisClient = null;

const initRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 50) return new Error('Max retries reached');
          return Math.min(retries * 100, 3000); // More resilient backoff
        }
      }
    });

    client.on('error', (err) => {
      if (process.env.NODE_ENV === 'production') console.error('Redis Error:', err.message);
    });

    await client.connect();
    console.log('Connected to Upstash Redis');
    redisClient = client;
  } catch (err) {
    console.warn(`Redis connection failed: ${err.message}. Using memory fallback.`);
    redisClient = null;
  }
};

const getRedisClient = () => redisClient;

module.exports = { initRedis, getRedisClient };
