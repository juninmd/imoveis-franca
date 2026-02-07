import Redis from 'ioredis';

export class RedisConnection {
  private static instance: Redis;

  private constructor() { }

  public static getInstance(): Redis {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new Redis({
        port: 32768,
        host: 'localhost',
        password: 'redispw'
      });
    }
    return RedisConnection.instance;
  }

  public static async setKey(key: string, value, ttlSeconds = undefined): Promise<void> {
    const client = RedisConnection.getInstance();
    if (ttlSeconds) {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } else {
      await client.set(key, JSON.stringify(value));
    }
  }

  public static async getKey<T>(key: string): Promise<T | null> {
    const client = RedisConnection.getInstance();
    const value = await client.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  }
}

export default RedisConnection;
