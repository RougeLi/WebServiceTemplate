import Redis, { RedisOptions } from 'ioredis';
import { LoggerService } from 'src/core/services';
import { APPName, RedisConfig, IDBService } from 'src/core/types';
import EnvironmentService from './environment.service';

const LOG_PREFIX = '[RedisService]';
const DEFAULT_RETRY_MULTIPLIER = 50;
const DEFAULT_RETRY_MAX_TIMEOUT = 2000;

/** Redis 操作的介面定義 */
interface IRedisOperations {
  get(key: string): Promise<string | null>;

  set(key: string, value: string, ...args: any[]): Promise<'OK' | null>;

  del(...keys: string[]): Promise<number>;

  unlink(...keys: string[]): Promise<number>;

  quit(): Promise<'OK'>;

  sadd(key: string, ...members: string[]): Promise<number>;

  incrby(key: string, increment: number): Promise<number>;

  expire(key: string, seconds: number): Promise<number>;

  setnx(key: string, value: string): Promise<number>;

  ping(): Promise<string>;

  hset(key: string, field: string, value: string): Promise<number>;

  hmset(key: string, object: Record<string, string>): Promise<'OK'>;

  hgetall(key: string): Promise<Record<string, string>>;

  getClient(): Redis | null;
}

/** 根據配置構建 RedisOptions，如果沒有配置則返回 null */
function buildRedisOptions(
  config: RedisConfig,
  appName: APPName,
): RedisOptions | null {
  if (!config) return null;

  const { host, port, password, db } = config;
  return {
    connectionName: `${appName}-redis`,
    host,
    port,
    password,
    db,
    retryStrategy: (times: number) =>
      Math.min(times * DEFAULT_RETRY_MULTIPLIER, DEFAULT_RETRY_MAX_TIMEOUT),
    noDelay: true,
  };
}

/** Redis 適配器：確保類型安全的 Redis 操作 */
class RedisAdapter implements IRedisOperations {
  constructor(
    private readonly redisClient: Redis,
    private readonly logger: LoggerService,
  ) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ...args: any[]): Promise<'OK' | null> {
    return this.redisClient.set(key, value, ...args);
  }

  async del(...keys: string[]): Promise<number> {
    return this.redisClient.del(...keys);
  }

  async unlink(...keys: string[]): Promise<number> {
    return this.redisClient.unlink(...keys);
  }

  async quit(): Promise<'OK'> {
    this.logger.info(`${LOG_PREFIX} quit() 被調用。`);
    return this.redisClient.quit();
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.redisClient.sadd(key, ...members);
  }

  async incrby(key: string, increment: number): Promise<number> {
    return this.redisClient.incrby(key, increment);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(key, seconds);
  }

  async setnx(key: string, value: string): Promise<number> {
    return this.redisClient.setnx(key, value);
  }

  async ping(): Promise<string> {
    return this.redisClient.ping();
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return this.redisClient.hset(key, field, value);
  }

  async hmset(key: string, object: Record<string, string>): Promise<'OK'> {
    return this.redisClient.hmset(key, object);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  getClient(): Redis | null {
    return this.redisClient;
  }
}

/** 空對象模式：在配置缺失時提供默認行為 */
class NullRedisClient implements IRedisOperations {
  constructor(private readonly logger: LoggerService) {}

  async get(key: string): Promise<string | null> {
    this.logger.warn(`${LOG_PREFIX} get(${key}) 已跳過：缺少配置`);
    return null;
  }

  async set(
    key: string,
    _value: string,
    ..._args: any[]
  ): Promise<'OK' | null> {
    this.logger.warn(`${LOG_PREFIX} set(${key}) 已跳過：缺少配置`);
    return 'OK';
  }

  async del(..._keys: string[]): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} del() 已跳過：缺少配置`);
    return 0;
  }

  async unlink(..._keys: string[]): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} unlink() 已跳過：缺少配置`);
    return 0;
  }

  async quit(): Promise<'OK'> {
    this.logger.warn(`${LOG_PREFIX} quit() 已跳過：缺少配置`);
    return 'OK';
  }

  async sadd(key: string, ..._members: string[]): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} sadd(${key}) 已跳過：缺少配置`);
    return 0;
  }

  async incrby(key: string, _increment: number): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} incrby(${key}) 已跳過：缺少配置`);
    return 0;
  }

  async expire(key: string, _seconds: number): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} expire(${key}) 已跳過：缺少配置`);
    return 0;
  }

  async setnx(key: string, _value: string): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} setnx(${key}) 已跳過：缺少配置`);
    return 0;
  }

  async ping(): Promise<string> {
    this.logger.warn(`${LOG_PREFIX} ping() 已跳過：缺少配置`);
    return 'PONG';
  }

  async hset(key: string, field: string, _value: string): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} hset(${key}, ${field}) 已跳過：缺少配置`);
    return 0;
  }

  async hmset(key: string, _obj: Record<string, string>): Promise<'OK'> {
    this.logger.warn(`${LOG_PREFIX} hmset(${key}) 已跳過：缺少配置`);
    return 'OK';
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.logger.warn(`${LOG_PREFIX} hgetall(${key}) 已跳過：缺少配置`);
    return {};
  }

  getClient(): Redis | null {
    this.logger.warn(`${LOG_PREFIX} getClient() 已跳過：缺少配置`);
    return null;
  }
}

/** Redis 服務：提供統一的 Redis 操作介面 */
export default class RedisService implements IDBService {
  private client!: IRedisOperations;
  private readonly keyPrefix: string = 'app';
  private readonly keySeparator: string = ':';
  private isNullClient: boolean = false;

  constructor(
    private readonly logger: LoggerService,
    private readonly environment: EnvironmentService,
  ) {
    const { redisConfig } = this.environment.getConfig();
    if (redisConfig) {
      this.keyPrefix = redisConfig.keyPrefix;
      this.keySeparator = redisConfig.keySeparator;
    }
  }

  /** 建立連接：有配置時 -> 真實的 Redis 客戶端，無配置時 -> NullRedisClient */
  async connect(): Promise<void> {
    try {
      const { redisConfig, appName } = this.environment.getConfig();
      const options = buildRedisOptions(redisConfig, appName);

      if (options) {
        const redisClient = new Redis(options);
        redisClient.once('connect', () => {
          this.logger.info(`${LOG_PREFIX} connected.`);
        });
        redisClient.on('error', (error: Error) => {
          this.logger.error(`${LOG_PREFIX} error: ${error.message}`);
        });
        this.client = new RedisAdapter(redisClient, this.logger);
        this.isNullClient = false;
      } else {
        this.logger.warn(`${LOG_PREFIX} missing config, using NullRedisClient`);
        this.client = new NullRedisClient(this.logger);
        this.isNullClient = true;
      }
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX} connection failed: ${(error as Error).message}`,
      );
      this.logger.warn(
        `${LOG_PREFIX} falling back to NullRedisClient due to connection failure`,
      );
      this.client = new NullRedisClient(this.logger);
      this.isNullClient = true;
    }
  }

  /** 結束連接 */
  async disconnect(): Promise<void> {
    await this.client.quit();
    if (!this.isNullClient) {
      this.logger.info(`${LOG_PREFIX} disconnected.`);
    } else {
      this.logger.warn(
        `${LOG_PREFIX} disconnect skipped: using NullRedisClient`,
      );
    }
  }

  /** 通過添加前綴格式化鍵 */
  private formatKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}${this.keySeparator}${key}` : key;
  }

  /** 將值序列化為 JSON 字符串 */
  private serialize(value: any): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX} serialize error: ${(error as Error).message}`,
      );
      return String(value);
    }
  }

  /** 將 JSON 字符串反序列化為值 */
  private deserialize(value: string | null): any {
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /** 設置鍵值，可選過期時間，支持任何可序列化的值 */
  async set(
    key: string,
    value: any,
    expiryInSeconds?: number,
  ): Promise<'OK' | null> {
    const formattedKey = this.formatKey(key);
    const serializedValue = this.serialize(value);

    if (expiryInSeconds) {
      return this.client.set(
        formattedKey,
        serializedValue,
        'EX',
        expiryInSeconds,
      );
    }
    return this.client.set(formattedKey, serializedValue);
  }

  /** 獲取鍵值，自動反序列化JSON值 */
  async get<T = any>(key: string): Promise<T | null> {
    const formattedKey = this.formatKey(key);
    const value = await this.client.get(formattedKey);
    return this.deserialize(value) as T | null;
  }

  /** 獲取鍵的原始字符串值（不進行反序列化） */
  async getRaw(key: string): Promise<string | null> {
    const formattedKey = this.formatKey(key);
    return this.client.get(formattedKey);
  }

  /** 刪除一個或多個鍵 */
  async del(...keys: string[]): Promise<number> {
    const formattedKeys = keys.map((key) => this.formatKey(key));
    return this.client.del(...formattedKeys);
  }

  /** 非阻塞方式刪除一個或多個鍵（異步執行） */
  async unlink(...keys: string[]): Promise<number> {
    const formattedKeys = keys.map((key) => this.formatKey(key));
    return this.client.unlink(...formattedKeys);
  }

  /** 向集合添加一個或多個成員，支持任何可序列化的值 */
  async sadd(key: string, ...members: any[]): Promise<number> {
    const formattedKey = this.formatKey(key);
    const serializedMembers = members.map((member) =>
      typeof member === 'string' ? member : this.serialize(member),
    );
    return this.client.sadd(formattedKey, ...serializedMembers);
  }

  /** 將存儲在鍵中的數字增加指定的增量 */
  async incrby(key: string, increment: number): Promise<number> {
    const formattedKey = this.formatKey(key);
    return this.client.incrby(formattedKey, increment);
  }

  /** 設置鍵的過期時間 */
  async expire(key: string, seconds: number): Promise<number> {
    const formattedKey = this.formatKey(key);
    return this.client.expire(formattedKey, seconds);
  }

  /** 僅當鍵不存在時設置鍵值，支持任何可序列化的值 */
  async setnx(key: string, value: any): Promise<number> {
    const formattedKey = this.formatKey(key);
    const serializedValue = this.serialize(value);
    return this.client.setnx(formattedKey, serializedValue);
  }

  /** 健康檢查：檢查Redis連接狀態 */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX} health check failed: ${(error as Error).message}`,
      );
      return false;
    }
  }

  /** 向 Redis 伺服器發送 PING 命令 */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  /** 獲取原生 Redis 客戶端實例，用於進階操作 */
  getClient(): Redis {
    const client = this.client.getClient();
    if (!client) {
      throw new Error(
        `${LOG_PREFIX} Redis client not available: missing configuration`,
      );
    }
    return client;
  }

  /** 設置哈希表中的字段值，支持任何可序列化的值 */
  async hset(key: string, field: string, value: any): Promise<number> {
    const formattedKey = this.formatKey(key);
    const serializedValue =
      typeof value === 'string' ? value : this.serialize(value);
    return this.client.hset(formattedKey, field, serializedValue);
  }

  /** 同時設置哈希表中的多個字段值，支持任何可序列化的值 */
  async hmset(key: string, object: Record<string, any>): Promise<'OK'> {
    const formattedKey = this.formatKey(key);
    const serializedObj: Record<string, string> = {};

    for (const [field, value] of Object.entries(object)) {
      serializedObj[field] = this.serialize(value);
    }

    return this.client.hmset(formattedKey, serializedObj);
  }

  /** 獲取哈希表中的所有字段和值 */
  async hgetall<T>(key: string) {
    const formattedKey = this.formatKey(key);
    return (await this.client.hgetall(formattedKey)) as T;
  }
}
