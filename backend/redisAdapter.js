// backend/redisAdapter.js
const Redis = require('ioredis');

// Хранилище для ключей, которые не являются основными объектами (uid -> id)
const UnlinkedRedisAdapter = require('oidc-provider/lib/adapters/unlinked_redis_adapter');

class RedisAdapter {
  constructor(name) {
    // name - это имя модели ('Session', 'AccessToken', и т.д.)
    this.name = name;
    // Используем один клиент Redis для всех адаптеров
    // `new Redis()` без аргументов подключится к localhost:6379
    // `new Redis(process.env.REDIS_URL)` для подключения к удаленному серверу
    this.client = new Redis(process.env.REDIS_URL);
  }

  // Формируем ключ с правильным префиксом
  key(id) {
    return `oidc:${this.name}:${id}`;
  }

  // Сохраняем или обновляем запись
  async upsert(id, payload, expiresIn) {
    const key = this.key(id);

    // oidc-provider использует вторичные "индексы" для быстрого поиска.
    // Например, для сессии он хранит grantId, чтобы можно было удалить все сессии по grantId.
    // Мы будем использовать пайплайн для атомарного выполнения операций.
    const pipeline = this.client.pipeline();

    // Сохраняем основной объект
    pipeline.set(key, JSON.stringify(payload), 'EX', expiresIn);

    // Сохраняем "индексы"
    if (payload.grantId) {
      const grantKey = `oidc:grantId:${payload.grantId}`;
      pipeline.add(grantKey, key);
      pipeline.expire(grantKey, expiresIn);
    }

    if (payload.userCode) {
      const userCodeKey = `oidc:userCode:${payload.userCode}`;
      pipeline.set(userCodeKey, id, 'EX', expiresIn);
    }

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
    return JSON.parse(data);
  }

  // Находим запись по UID (для нашего wallet flow)
  async findByUid(uid) {
    const id = await this.client.get(`oidc:uid:${uid}`);
    return this.find(id);
  }

  // Находим запись по user code (для device flow)
  async findByUserCode(userCode) {
    const id = await this.client.get(`oidc:userCode:${userCode}`);
    return this.find(id);
  }

  // Помечаем запись как "использованную"
  async consume(id) {
    // ПРАВИЛЬНАЯ ЛОГИКА: получаем, изменяем, сохраняем
    const key = this.key(id);
    const stored = await this.client.get(key);
    if (stored) {
      const payload = JSON.parse(stored);
      payload.consumed = Math.floor(Date.now() / 1000);
      await this.client.set(key, JSON.stringify(payload));
    }
  }

  // Удаляем запись
  async destroy(id) {
    const key = this.key(id);
    await this.client.del(key);
  }

  // Удаляем все записи, связанные с grantId
  async revokeByGrantId(grantId) {
    const grantKey = `oidc:grantId:${grantId}`;
    const keys = await this.client.smembers(grantKey);
    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.del(key));
    pipeline.del(grantKey);
    await pipeline.exec();
  }

  // oidc-provider ожидает, что этот метод тоже будет, хоть мы его и не используем напрямую
  static async connect() {
    // В этой реализации подключение происходит в конструкторе
    return;
  }
}

module.exports = RedisAdapter;