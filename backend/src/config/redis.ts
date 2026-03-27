import Redis from 'ioredis';
import config from './index';
import pino from 'pino';

const logger = pino({ level: config.logging.level });

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: config.redis.retryStrategy,
      lazyConnect: false,
    });

    redis.on('error', (err: Error) => logger.error('Redis error', err));
    redis.on('connect', () => logger.info('Redis connected'));
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default { getRedis, closeRedis };
