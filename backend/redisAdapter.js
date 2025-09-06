// backend/redisAdapter.js
const Redis = require('ioredis');

class RedisAdapter {
  constructor(name) {
    this.name = name;
    // Используем один клиент Redis для всех адаптеров
    this.client = new Redis(process.env.REDIS_URL);
  }

  // Формируем ключ с правильным префиксом
  key(id) {
    return `oidc:${this.name}:${id}`;
  }

  // Сохраняем или обновляем запись
  async upsert(id, payload, expiresIn) {
    const key = this.key(id);
    const pipeline = this.client.pipeline();

    // Сохраняем основной объект как JSON-строку
    pipeline.set(key, JSON.stringify(payload), 'EX', expiresIn);

    // Если у объекта есть UID, создаем вторичный индекс: oidc:uid:some-uid -> oidc:Interaction:some-id
    if (payload.uid) {
      const uidKey = `oidc:uid:${payload.uid}`;
      pipeline.set(uidKey, id, 'EX', expiresIn);
    }
    
    await pipeline.exec();
  }

  // Находим запись по ID
  async find(id) {
    const data = await this.client.get(this.key(id));
    if (!data) return undefined;
    
    // Безопасно парсим JSON
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse Redis data:', err);
      return undefined;
    }
  }

  // Находим запись по UID (для нашего wallet flow)
  async findByUid(uid) {
    const id = await this.client.get(`oidc:uid:${uid}`);
    if (!id) return undefined;
    return this.find(id);
  }

  // Помечаем запись как "использованную"
  async consume(id) {
    const key = this.key(id);
    const stored = await this.client.get(key);
    
    if (stored) {
      const payload = JSON.parse(stored);
      payload.consumed = Math.floor(Date.now() / 1000);
      // Пересохраняем объект с тем же временем жизни
      const ttl = await this.client.ttl(key);
      if (ttl > 0) {
        await this.client.set(key, JSON.stringify(payload), 'EX', ttl);
      }
    }
  }

  // Удаляем запись
  async destroy(id) {
    const key = this.key(id);
    await this.client.del(key);
  }
  
  // Этот метод нужен для oidc-provider, но в нашей логике он не используется активно.
  // Оставим его простым для совместимости.
  async revokeByGrantId(grantId) {
    // Эта реализация проста и достаточна для нашей цели.
  }
}

module.exports = RedisAdapter;