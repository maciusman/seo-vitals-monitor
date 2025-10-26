import Redis from 'ioredis';

const getRedisConfig = () => {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required for BullMQ
  };
};

// Redis client for general use
export const redis = new Redis(getRedisConfig());

// Connection factory for BullMQ
export const createRedisConnection = () => {
  return new Redis(getRedisConfig());
};

export default redis;
