import Redis, { RedisOptions } from 'ioredis';
import { LoggerService } from 'src/core/services';
import { APPName, RedisConfig, IDBService } from 'src/core/types';
import EnvironmentService from './environment.service';

const LOG_PREFIX = '[RedisService]';
const DEFAULT_RETRY_MULTIPLIER = 50;
const DEFAULT_RETRY_MAX_TIMEOUT = 2000;
const DEFAULT_KEY_PREFIX = '';
const DEFAULT_KEY_SEPARATOR = ':';

/**
 * Redis operations' interface definition
 */
interface IRedisOperations {
  get(key: string): Promise<string | null>;

  set(key: string, value: string, ...args: any[]): Promise<'OK' | null>;

  del(...keys: string[]): Promise<number>;

  quit(): Promise<'OK'>;

  sadd(key: string, ...members: string[]): Promise<number>;

  incrby(key: string, increment: number): Promise<number>;

  expire(key: string, seconds: number): Promise<number>;

  setnx(key: string, value: string): Promise<number>;

  ping(): Promise<string>;

  publish(channel: string, message: string): Promise<number>;

  subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void>;
}

/**
 * Build RedisOptions based on configuration, return null if no configuration
 */
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

/**
 * Redis Adapter: Ensure type-safe Redis operations
 */
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

  async quit(): Promise<'OK'> {
    this.logger.info(`${LOG_PREFIX} quit() called.`);
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

  async publish(channel: string, message: string): Promise<number> {
    return this.redisClient.publish(channel, message);
  }

  async subscribe(
    channel: string,
    callback: (message: string, channel: string) => void,
  ): Promise<void> {
    await this.redisClient.subscribe(channel);

    this.redisClient.on('message', (channel, channelMessage) => {
      if (channel === channel) {
        callback(channelMessage, channel);
      }
    });
  }
}

/**
 * Null Object Pattern: Provide the default behavior when configuration is missing
 */
class NullRedisClient implements IRedisOperations {
  constructor(private readonly logger: LoggerService) {}

  async get(key: string): Promise<string | null> {
    this.logger.warn(`${LOG_PREFIX} get(${key}) skipped: missing config`);
    return null;
  }

  async set(
    key: string,
    _value: string,
    ..._args: any[]
  ): Promise<'OK' | null> {
    this.logger.warn(`${LOG_PREFIX} set(${key}) skipped: missing config`);
    return 'OK';
  }

  async del(..._keys: string[]): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} del() skipped: missing config`);
    return 0;
  }

  async quit(): Promise<'OK'> {
    this.logger.warn(`${LOG_PREFIX} quit() skipped: missing config`);
    return 'OK';
  }

  async sadd(key: string, ..._members: string[]): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} sadd(${key}) skipped: missing config`);
    return 0;
  }

  async incrby(key: string, _increment: number): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} incrby(${key}) skipped: missing config`);
    return 0;
  }

  async expire(key: string, _seconds: number): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} expire(${key}) skipped: missing config`);
    return 0;
  }

  async setnx(key: string, _value: string): Promise<number> {
    this.logger.warn(`${LOG_PREFIX} setnx(${key}) skipped: missing config`);
    return 0;
  }

  async ping(): Promise<string> {
    this.logger.warn(`${LOG_PREFIX} ping() skipped: missing config`);
    return 'PONG';
  }

  async publish(channel: string, _message: string): Promise<number> {
    this.logger.warn(
      `${LOG_PREFIX} publish(${channel}) skipped: missing config`,
    );
    return 0;
  }

  async subscribe(
    channel: string,
    _callback: (message: string, channel: string) => void,
  ): Promise<void> {
    this.logger.warn(
      `${LOG_PREFIX} subscribe(${channel}) skipped: missing config`,
    );
  }
}

/**
 * Redis Service: Provides a unified interface for Redis operations
 */
export default class RedisService implements IDBService {
  private client!: IRedisOperations;
  private readonly keyPrefix: string = DEFAULT_KEY_PREFIX;
  private readonly keySeparator: string = DEFAULT_KEY_SEPARATOR;
  private isNullClient: boolean = false;

  constructor(
    private readonly logger: LoggerService,
    private readonly environment: EnvironmentService,
    keyPrefix?: string,
    keySeparator?: string,
  ) {
    if (keyPrefix) this.keyPrefix = keyPrefix;
    if (keySeparator) this.keySeparator = keySeparator;
  }

  /**
   * Establish connection: With config -> the Real Redis client, Without config -> NullRedisClient
   */
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

  /**
   * End connection
   */
  async disconnect(): Promise<void> {
    if (!this.isNullClient) {
      await this.client.quit();
      this.logger.info(`${LOG_PREFIX} disconnected.`);
    } else {
      this.logger.warn(
        `${LOG_PREFIX} disconnect skipped: using NullRedisClient`,
      );
    }
  }

  /**
   * Format key by adding prefix
   */
  private formatKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}${this.keySeparator}${key}` : key;
  }

  /**
   * Serialize value to JSON string
   */
  private serialize(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    try {
      return JSON.stringify(value);
    } catch (error) {
      this.logger.error(
        `${LOG_PREFIX} serialize error: ${(error as Error).message}`,
      );
      return String(value);
    }
  }

  /**
   * Deserialize JSON string to value
   */
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

  /**
   * Set key with optional TTL
   * Supports any serializable value
   */
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

  /**
   * Get key
   * Automatically deserializes JSON values
   */
  async get<T = any>(key: string): Promise<T | null> {
    const formattedKey = this.formatKey(key);
    const value = await this.client.get(formattedKey);
    return this.deserialize(value) as T | null;
  }

  /**
   * Get raw string value for the key (no deserialization)
   */
  async getRaw(key: string): Promise<string | null> {
    const formattedKey = this.formatKey(key);
    return this.client.get(formattedKey);
  }

  /**
   * Delete one or more keys
   */
  async del(...keys: string[]): Promise<number> {
    const formattedKeys = keys.map((key) => this.formatKey(key));
    return this.client.del(...formattedKeys);
  }

  /**
   * Add one or more members to a set
   * Supports any serializable value
   */
  async sadd(key: string, ...members: any[]): Promise<number> {
    const formattedKey = this.formatKey(key);
    const serializedMembers = members.map((member) => this.serialize(member));
    return this.client.sadd(formattedKey, ...serializedMembers);
  }

  /**
   * Increment the number stored at the key by increment
   */
  async incrby(key: string, increment: number): Promise<number> {
    const formattedKey = this.formatKey(key);
    return this.client.incrby(formattedKey, increment);
  }

  /**
   * Set the expiration time for the key
   */
  async expire(key: string, seconds: number): Promise<number> {
    const formattedKey = this.formatKey(key);
    return this.client.expire(formattedKey, seconds);
  }

  /**
   * Set key to value only if the key does not exist
   * Supports any serializable value
   */
  async setnx(key: string, value: any): Promise<number> {
    const formattedKey = this.formatKey(key);
    const serializedValue = this.serialize(value);
    return this.client.setnx(formattedKey, serializedValue);
  }

  /**
   * Health check: Check Redis connection status
   * @returns Connection status, true indicates normal connection, false indicates abnormal connection
   */
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

  /**
   * Send PING command to Redis server
   * @returns 'PONG' if connection is normal
   */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Publish a message to a channel
   * Supports any serializable value as message
   * @param channel The channel to publish to
   * @param message The message to publish
   * @returns The number of clients that received the message
   */
  async publish(channel: string, message: any): Promise<number> {
    const serializedMessage = this.serialize(message);
    return this.client.publish(channel, serializedMessage);
  }

  /**
   * Subscribe to a channel
   * Automatically deserializes JSON messages
   * @param channel The channel to subscribe to
   * @param callback The callback function to execute when a message is received
   */
  async subscribe(
    channel: string,
    callback: (message: any, channel: string) => void,
  ): Promise<void> {
    return this.client.subscribe(channel, (message, channel) => {
      const deserializedMessage = this.deserialize(message);
      callback(deserializedMessage, channel);
    });
  }
}
