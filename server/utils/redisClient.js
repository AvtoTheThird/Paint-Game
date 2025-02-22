const { EventEmitter } = require("events");
const { createClient } = require("redis");

class RedisClient extends EventEmitter {
  constructor() {
    super();
    this.client = createClient({ url: "redis://localhost:6379" });
    this.subscriber = this.client.duplicate();
    // this.subscriber = createClient({ url: "redis://localhost:6379" });

    // Main client events
    this.client.on("connect", () => console.log("Connected to Redis client"));
    this.client.on("error", (err) => console.error("Redis Client Error:", err));

    // Subscriber setup for expiration events
    this.subscriber.on("connect", () =>
      console.log("Connected to Redis subscriber")
    );
    this.subscriber.on("error", (err) =>
      console.error("Redis Subscriber Error:", err)
    );

    this.subscriber
      .connect()
      .then(() => this.subscriber.configSet("notify-keyspace-events", "Ex"))
      .then(() => {
        // Pass the message handling callback as the second argument to subscribe
        return this.subscriber.subscribe(
          "__keyevent@0__:expired",
          (message) => {
            if (message.startsWith("timer:")) {
              const roomId = message.split(":")[1];
              this.emit("timerExpired", roomId);
            }
          }
        );
      })
      .catch((err) => console.error("Subscriber error:", err));

    this.client.connect();
  }

  async get(key) {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`Redis GET Error: ${err}`);
      return null;
    }
  }

  async set(key, value, mode, duration) {
    try {
      if (mode && duration)
        await this.client.set(key, value, { [mode]: duration });
      else await this.client.set(key, value);
    } catch (err) {
      console.error(`Redis SET Error: ${err}`);
    }
  }

  async hset(key, field, value) {
    try {
      await this.client.hSet(key, field, value);
    } catch (err) {
      console.error(`Redis HSET Error: ${err}`);
    }
  }

  async hgetall(key) {
    try {
      return await this.client.hGetAll(key);
    } catch (err) {
      console.error(`Redis HGETALL Error: ${err}`);
      return null;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`Redis DEL Error: ${err}`);
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
}

const redisClient = new RedisClient();
module.exports = redisClient;
