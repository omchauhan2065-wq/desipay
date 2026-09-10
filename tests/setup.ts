/**
 * Jest Global Test Setup
 * ================================================
 * Configures test environment and in-memory mock for Redis
 * so tests run instantly and deterministically without external daemon.
 * 
 * Developed by: Om Chauhan
 */

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.SMS_PROVIDER = 'mock';
process.env.BCRYPT_SALT_ROUNDS = '10';

// In-memory Redis Mock
const redisData = new Map<string, string>();
const redisSets = new Map<string, Set<string>>();

class MockRedis {
  async get(key: string): Promise<string | null> {
    return redisData.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    redisData.set(key, value);
    return 'OK';
  }

  async setex(key: string, _seconds: number, value: string): Promise<'OK'> {
    redisData.set(key, value);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = redisData.delete(key) || redisSets.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const val = parseInt(redisData.get(key) || '0', 10) + 1;
    redisData.set(key, String(val));
    return val;
  }

  async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!redisSets.has(key)) redisSets.set(key, new Set());
    const set = redisSets.get(key)!;
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async smembers(key: string): Promise<string[]> {
    const set = redisSets.get(key);
    return set ? Array.from(set) : [];
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = redisSets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  on(_event: string, _cb: Function): this {
    return this;
  }

  async connect(): Promise<void> {}
  async quit(): Promise<'OK'> {
    return 'OK';
  }
}

// Mock ioredis module
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => new MockRedis());
});

// Suppress console outputs
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
