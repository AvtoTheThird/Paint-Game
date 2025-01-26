const { createClient } = require("redis");

class RedisClient {
  constructor() {
    this.client = createClient({
      url: "redis://localhost:6379", // Use the correct URL format
    });

    // Handle connection events
    this.client.on("connect", () => {
      console.log("Connected to Redis");
    });

    this.client.on("error", (err) => {
      console.error("Redis Error:", err);
    });

    // Connect to Redis
    this.client.connect();
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`Redis GET Error (Key: ${key}):`, err);
      return null;
    }
  }

  async set(key, value) {
    try {
      await this.client.set(key, value);
    } catch (err) {
      console.error(`Redis SET Error (Key: ${key}):`, err);
    }
  }

  async hset(key, field, value) {
    try {
      await this.client.hSet(key, field, value); // Note: hSet (uppercase S) in Redis 4.x
    } catch (err) {
      console.error(`Redis HSET Error (Key: ${key}):`, err);
    }
  }

  async hgetall(key) {
    try {
      return await this.client.hGetAll(key); // Note: hGetAll (uppercase G and A) in Redis 4.x
    } catch (err) {
      console.error(`Redis HGETALL Error (Key: ${key}):`, err);
      return null;
    }
  }
  async scan(pattern) {
    try {
      const foundKeys = [];
      let cursor = 0;
      do {
        const reply = await this.client.scan(cursor, { MATCH: pattern });
        cursor = reply.cursor;
        foundKeys.push(...reply.keys);
      } while (cursor !== 0);
      return foundKeys;
    } catch (err) {
      console.error("Redis SCAN Error:", err);
      return [];
    }
  }
  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Redis DEL Error (Key: ${key}):`, err);
    }
  }
}

// Export a singleton instance of RedisClient
const redisClient = new RedisClient();
module.exports = redisClient;
