import Redis from 'ioredis';
import { LoggerService } from 'src/core/services';
import EnvironmentService from '../environment.service';
import RedisService from '../redis.service';

jest.mock('ioredis');

describe('RedisService', () => {
  let redisService: RedisService;
  let loggerService: LoggerService;
  let environmentService: EnvironmentService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mocks
    mockRedisClient = new Redis() as jest.Mocked<Redis>;
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(
      () => mockRedisClient,
    );

    // Create logger mock
    loggerService = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
    } as unknown as LoggerService;

    // Create environment service mock
    environmentService = {
      getConfig: jest.fn().mockReturnValue({
        redisConfig: {
          host: 'localhost',
          port: 6379,
          password: 'password',
          db: 0,
          keyPrefix: 'test',
          keySeparator: ':',
        },
        appName: 'test-app',
      }),
    } as unknown as EnvironmentService;

    // Create redis service
    redisService = new RedisService(loggerService, environmentService);
  });

  describe('connect', () => {
    it('should initialize Redis client when config is available', async () => {
      await redisService.connect();

      // Simulate Redis connect event
      const connectCall = mockRedisClient.once.mock.calls.find(
        (call) => call[0] === 'connect',
      );
      const connectCallback = connectCall ? connectCall[1] : undefined;

      // Make sure the callback exists before calling it
      if (connectCallback) {
        connectCallback();
      }

      expect(Redis).toHaveBeenCalledWith({
        connectionName: 'test-app-redis',
        host: 'localhost',
        port: 6379,
        password: 'password',
        db: 0,
        retryStrategy: expect.any(Function),
        noDelay: true,
      });
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('connected'),
      );
    });

    it('should use NullRedisClient when config is missing', async () => {
      environmentService.getConfig = jest.fn().mockReturnValue({
        redisConfig: null,
        appName: 'test-app',
      });

      // Clear mock call history right before this test
      jest.clearAllMocks();

      await redisService.connect();
      expect(Redis).not.toHaveBeenCalled();
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('missing config'),
      );
    });

    it('should handle connection errors', async () => {
      // Reset the mock implementation to throw an error when called
      jest.clearAllMocks();
      (Redis as jest.MockedClass<typeof Redis>).mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await redisService.connect();
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('connection failed'),
      );
      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('falling back to NullRedisClient'),
      );
    });

    it('should handle Redis error events', async () => {
      await redisService.connect();

      // Simulate Redis error event
      const errorCall = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === 'error',
      );
      const errorCallback = errorCall ? errorCall[1] : undefined;

      // Make sure the callback exists before calling it
      if (errorCallback) {
        errorCallback(new Error('Redis error'));
      }

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis error'),
      );
    });
  });

  describe('disconnect', () => {
    it('should quit Redis client when connected', async () => {
      mockRedisClient.quit = jest.fn().mockResolvedValue('OK');

      await redisService.connect();
      await redisService.disconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('disconnected'),
      );
    });

    it('should skip disconnection when using NullRedisClient', async () => {
      environmentService.getConfig = jest.fn().mockReturnValue({
        redisConfig: null,
        appName: 'test-app',
      });

      await redisService.connect();
      await redisService.disconnect();

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('disconnect skipped'),
      );
    });
  });

  describe('getClient', () => {
    it('should throw an error when Redis client is not available', async () => {
      // Override environment service to return no Redis config
      environmentService.getConfig = jest.fn().mockReturnValue({
        redisConfig: null,
        appName: 'test-app',
      });

      // Connect to initialize the client
      await redisService.connect();

      // Expect getClient to throw an error
      expect(() => redisService.getClient()).toThrow(
        'Redis client not available',
      );
    });

    it('should return the Redis client when available', async () => {
      // Connect to initialize the client
      await redisService.connect();

      // Get the client
      const client = redisService.getClient();

      // Expect the client to be the mock Redis client
      expect(client).toBe(mockRedisClient);
    });

    it('should allow calling Redis native methods on the client', async () => {
      // Setup mock methods on the Redis client
      mockRedisClient.publish = jest.fn().mockResolvedValue(1);
      mockRedisClient.subscribe = jest.fn().mockResolvedValue('OK');
      mockRedisClient.pipeline = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      // Connect to initialize the client
      await redisService.connect();

      // Get the client
      const client = redisService.getClient();

      // Call native Redis methods
      await client.publish('channel', 'message');
      await client.subscribe('channel');
      client.pipeline().exec();

      // Verify the methods were called
      expect(mockRedisClient.publish).toHaveBeenCalledWith(
        'channel',
        'message',
      );
      expect(mockRedisClient.subscribe).toHaveBeenCalledWith('channel');
      expect(mockRedisClient.pipeline).toHaveBeenCalled();
    });
  });

  // Test that CRUD operations still work
  describe('CRUD operations', () => {
    beforeEach(async () => {
      // Connect to initialize the client
      await redisService.connect();
    });

    it('should set and get a value', async () => {
      // Setup mock methods
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');
      mockRedisClient.get = jest.fn().mockResolvedValue('{"test":"value"}');

      // Set a value
      await redisService.set('key', { test: 'value' });

      // Get the value
      const value = await redisService.get('key');

      // Verify the methods were called with the correct arguments
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key',
        '{"test":"value"}',
      );
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
      expect(value).toEqual({ test: 'value' });
    });

    it('should set a value with expiry', async () => {
      // Setup mock methods
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');

      // Set a value with expiry
      await redisService.set('key', 'value', 60);

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key',
        '"value"',
        'EX',
        60,
      );
    });

    it('should get raw value without deserialization', async () => {
      // Setup mock methods
      mockRedisClient.get = jest.fn().mockResolvedValue('{"test":"value"}');

      // Get raw value
      const value = await redisService.getRaw('key');

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key');
      expect(value).toBe('{"test":"value"}');
    });

    it('should delete a key', async () => {
      // Setup mock methods
      mockRedisClient.del = jest.fn().mockResolvedValue(1);

      // Delete a key
      await redisService.del('key');

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key');
    });

    it('should unlink a key', async () => {
      // Setup mock methods
      mockRedisClient.unlink = jest.fn().mockResolvedValue(1);

      // Unlink a key
      await redisService.unlink('key');

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.unlink).toHaveBeenCalledWith('test:key');
    });

    it('should add members to a set', async () => {
      // Setup mock methods
      mockRedisClient.sadd = jest.fn().mockResolvedValue(2);

      // Add members to a set
      const result = await redisService.sadd('key', 'value1', {
        test: 'value2',
      });

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.sadd).toHaveBeenCalledWith(
        'test:key',
        'value1',
        '{"test":"value2"}',
      );
      expect(result).toBe(2);
    });

    it('should increment a value by a specified amount', async () => {
      // Setup mock methods
      mockRedisClient.incrby = jest.fn().mockResolvedValue(5);

      // Increment a value
      const result = await redisService.incrby('key', 3);

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.incrby).toHaveBeenCalledWith('test:key', 3);
      expect(result).toBe(5);
    });

    it('should set expiry on a key', async () => {
      // Setup mock methods
      mockRedisClient.expire = jest.fn().mockResolvedValue(1);

      // Set expiry on a key
      const result = await redisService.expire('key', 60);

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.expire).toHaveBeenCalledWith('test:key', 60);
      expect(result).toBe(1);
    });

    it('should set a value only if key does not exist', async () => {
      // Setup mock methods
      mockRedisClient.setnx = jest.fn().mockResolvedValue(1);

      // Set a value only if key does not exist
      const result = await redisService.setnx('key', { test: 'value' });

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.setnx).toHaveBeenCalledWith(
        'test:key',
        '{"test":"value"}',
      );
      expect(result).toBe(1);
    });

    it('should set and get a hash', async () => {
      // Setup mock methods
      mockRedisClient.hset = jest.fn().mockResolvedValue(1);
      mockRedisClient.hgetall = jest
        .fn()
        .mockResolvedValue({ field: '"value"' });

      // Set a hash field
      await redisService.hset('key', 'field', 'value');

      // Get all hash fields
      const hash = await redisService.hgetall('key');

      // Verify the methods were called with the correct arguments
      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'test:key',
        'field',
        'value',
      );
      expect(mockRedisClient.hgetall).toHaveBeenCalledWith('test:key');
      expect(hash).toEqual({ field: '"value"' });
    });

    it('should set a hash field with a non-string value', async () => {
      // Setup mock methods
      mockRedisClient.hset = jest.fn().mockResolvedValue(1);

      // Set a hash field with an object value
      const objectValue = { test: 'value' };
      await redisService.hset('key', 'field', objectValue);

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'test:key',
        'field',
        '{"test":"value"}',
      );
    });

    it('should set multiple hash fields at once', async () => {
      // Setup mock methods
      mockRedisClient.hmset = jest.fn().mockResolvedValue('OK');

      // Set multiple hash fields
      const result = await redisService.hmset('key', {
        field1: 'value1',
        field2: { test: 'value2' },
      });

      // Verify the method was called with the correct arguments
      expect(mockRedisClient.hmset).toHaveBeenCalledWith('test:key', {
        field1: '"value1"',
        field2: '{"test":"value2"}',
      });
      expect(result).toBe('OK');
    });
  });

  describe('healthCheck', () => {
    it('should return true when Redis is healthy', async () => {
      // Setup mock methods
      mockRedisClient.ping = jest.fn().mockResolvedValue('PONG');

      // Connect to initialize the client
      await redisService.connect();

      // Check health
      const result = await redisService.healthCheck();

      // Verify the method was called and returned the expected result
      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when Redis health check fails', async () => {
      // Setup mock methods
      mockRedisClient.ping = jest
        .fn()
        .mockRejectedValue(new Error('Connection failed'));

      // Connect to initialize the client
      await redisService.connect();

      // Check health
      const result = await redisService.healthCheck();

      // Verify the method was called and returned the expected result
      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(result).toBe(false);
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('health check failed'),
      );
    });
  });

  describe('ping', () => {
    it('should send PING command to Redis server', async () => {
      // Setup mock methods
      mockRedisClient.ping = jest.fn().mockResolvedValue('PONG');

      // Connect to initialize the client
      await redisService.connect();

      // Send ping
      const result = await redisService.ping();

      // Verify the method was called and returned the expected result
      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(result).toBe('PONG');
    });
  });

  describe('NullRedisClient behavior', () => {
    beforeEach(async () => {
      // Override environment service to return no Redis config
      environmentService.getConfig = jest.fn().mockReturnValue({
        redisConfig: null,
        appName: 'test-app',
      });

      // Connect to initialize the NullRedisClient
      await redisService.connect();
    });

    it('should log warnings and return default values for get operation', async () => {
      const result = await redisService.get('key');

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('get(test:key) 已跳過'),
      );
      expect(result).toBeNull();
    });

    it('should log warnings and return default values for set operation', async () => {
      const result = await redisService.set('key', 'value');

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('set(test:key) 已跳過'),
      );
      expect(result).toBe('OK');
    });

    it('should log warnings and return default values for del operation', async () => {
      const result = await redisService.del('key');

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('del() 已跳過'),
      );
      expect(result).toBe(0);
    });

    it('should log warnings and return undefined for quit operation', async () => {
      const result = await redisService.disconnect();

      expect(loggerService.warn).toHaveBeenCalledWith(
        expect.stringContaining('quit() 已跳過'),
      );
      expect(result).toBeUndefined();
    });

    it('should log warnings and return default values for other operations', async () => {
      const unlinkResult = await redisService.unlink('key');
      const saddResult = await redisService.sadd('key', 'value');
      const incrbyResult = await redisService.incrby('key', 5);
      const expireResult = await redisService.expire('key', 60);
      const setnxResult = await redisService.setnx('key', 'value');
      const pingResult = await redisService.ping();
      const hsetResult = await redisService.hset('key', 'field', 'value');
      const hmsetResult = await redisService.hmset('key', { field: 'value' });
      const hgetallResult = await redisService.hgetall('key');

      expect(unlinkResult).toBe(0);
      expect(saddResult).toBe(0);
      expect(incrbyResult).toBe(0);
      expect(expireResult).toBe(0);
      expect(setnxResult).toBe(0);
      expect(pingResult).toBe('PONG');
      expect(hsetResult).toBe(0);
      expect(hmsetResult).toBe('OK');
      expect(hgetallResult).toEqual({});
    });
  });

  describe('Serialization and deserialization', () => {
    beforeEach(async () => {
      await redisService.connect();
    });

    it('should serialize string values directly', async () => {
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');

      await redisService.set('key', 'string value');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key',
        '"string value"',
      );
    });

    it('should serialize objects to JSON strings', async () => {
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');

      await redisService.set('key', { complex: 'object', with: ['array'] });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key',
        '{"complex":"object","with":["array"]}',
      );
    });

    it('should handle serialization errors', async () => {
      mockRedisClient.set = jest.fn().mockResolvedValue('OK');

      // Create circular reference that can't be serialized
      const circular: any = { self: null };
      circular.self = circular;

      await redisService.set('key', circular);

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('serialize error'),
      );
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key',
        expect.any(String),
      );
    });

    it('should deserialize JSON strings to objects', async () => {
      mockRedisClient.get = jest
        .fn()
        .mockResolvedValue('{"complex":"object","with":["array"]}');

      const result = await redisService.get('key');

      expect(result).toEqual({ complex: 'object', with: ['array'] });
    });

    it('should return strings that are not valid JSON as-is', async () => {
      mockRedisClient.get = jest.fn().mockResolvedValue('not valid json');

      const result = await redisService.get('key');

      expect(result).toBe('not valid json');
    });

    it('should return null for null values', async () => {
      mockRedisClient.get = jest.fn().mockResolvedValue(null);

      const result = await redisService.get('key');

      expect(result).toBeNull();
    });
  });

  describe('Key formatting', () => {
    it('should format keys with prefix and separator', async () => {
      await redisService.connect();
      mockRedisClient.get = jest.fn().mockResolvedValue(null);

      await redisService.get('mykey');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test:mykey');
    });

    it('should use custom key prefix and separator', async () => {
      // Override environment service to return custom prefix and separator
      environmentService.getConfig = jest.fn().mockReturnValue({
        redisConfig: {
          host: 'localhost',
          port: 6379,
          password: 'password',
          db: 0,
          keyPrefix: 'custom',
          keySeparator: '-',
        },
        appName: 'test-app',
      });

      // Create new service with custom config
      redisService = new RedisService(loggerService, environmentService);
      await redisService.connect();

      mockRedisClient.get = jest.fn().mockResolvedValue(null);
      await redisService.get('mykey');

      expect(mockRedisClient.get).toHaveBeenCalledWith('custom-mykey');
    });

    it('should not add prefix when prefix is empty', async () => {
      // Override environment service to return empty prefix
      environmentService.getConfig = jest.fn().mockReturnValue({
        redisConfig: {
          host: 'localhost',
          port: 6379,
          password: 'password',
          db: 0,
          keyPrefix: '',
          keySeparator: ':',
        },
        appName: 'test-app',
      });

      // Create new service with custom config
      redisService = new RedisService(loggerService, environmentService);
      await redisService.connect();

      mockRedisClient.get = jest.fn().mockResolvedValue(null);
      await redisService.get('mykey');

      expect(mockRedisClient.get).toHaveBeenCalledWith('mykey');
    });
  });
});
