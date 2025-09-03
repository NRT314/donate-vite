// backend/redisAdapter.js
const Redis = require("ioredis");

// Этот код основан на официальной документации oidc-provider
// Он говорит провайдеру, как хранить данные в Redis
class RedisAdapter {
  constructor(name) {
    this.client = new Redis(process.env.REDIS_URL, {
      keyPrefix: `oidc:${name}:`,
    });
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);
    await this.client.set(key, JSON.stringify(payload), "EX", expiresIn);
  }

  async find(id) {
    const data = await this.client.get(this.key(id));
    return data ? JSON.parse(data) : undefined;
  }

  async findByUserCode(userCode) {
    const id = await this.client.get(this.key(userCode));
    return this.find(id);
  }

  async findByUid(uid) {
    const id = await this.client.get(this.key(uid));
    return this.find(id);
  }

  async consume(id) {
    await this.client.hset(this.key(id), "consumed", Math.floor(Date.now() / 1000));
  }

  async destroy(id) {
    await this.client.del(this.key(id));
  }

  async revokeByGrantId(grantId) {
    const pipeline = this.client.pipeline();
    const results = await this.client.keys(`oidc:*:grantId:${grantId}`);
    results.forEach((key) => pipeline.del(key));
    await pipeline.exec();
  }

  key(id) {
    return id;
  }
}

module.exports = RedisAdapter;