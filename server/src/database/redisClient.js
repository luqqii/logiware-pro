const redis = require('redis');
require('dotenv').config();

const redisOptions = process.env.REDIS_URL 
  ? { url: process.env.REDIS_URL }
  : {
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
      password: process.env.REDIS_PASSWORD || undefined,
    };

const redisClient = redis.createClient(redisOptions);

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Redis connected'));

module.exports = redisClient;
