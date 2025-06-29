import {
  createInitializerPool,
  serviceInitializerPool,
} from '../initializer-pool';

describe('Initializer Pool', () => {
  describe('createInitializerPool', () => {
    it('should create an initializer pool with register and initializeAll methods', () => {
      const pool = createInitializerPool();

      expect(pool).toBeDefined();
      expect(typeof pool.register).toBe('function');
      expect(typeof pool.initializeAll).toBe('function');
    });

    it('should start with an empty list of initializers', async () => {
      const pool = createInitializerPool();

      // If no initializers are registered, initializeAll should complete without errors
      await expect(pool.initializeAll()).resolves.toBeUndefined();
    });
  });

  describe('register method', () => {
    it('should register an initialization function', async () => {
      const pool = createInitializerPool();
      const mockFn = jest.fn().mockResolvedValue(undefined);

      pool.register(mockFn);
      await pool.initializeAll();

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should register multiple initialization functions', async () => {
      const pool = createInitializerPool();
      const mockFn1 = jest.fn().mockResolvedValue(undefined);
      const mockFn2 = jest.fn().mockResolvedValue(undefined);
      const mockFn3 = jest.fn().mockResolvedValue(undefined);

      pool.register(mockFn1);
      pool.register(mockFn2);
      pool.register(mockFn3);

      await pool.initializeAll();

      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).toHaveBeenCalledTimes(1);
      expect(mockFn3).toHaveBeenCalledTimes(1);
    });
  });

  describe('initializeAll method', () => {
    it('should execute registered functions in sequence', async () => {
      const pool = createInitializerPool();
      const executionOrder: number[] = [];

      const mockFn1 = jest.fn().mockImplementation(async () => {
        executionOrder.push(1);
        return Promise.resolve();
      });

      const mockFn2 = jest.fn().mockImplementation(async () => {
        executionOrder.push(2);
        return Promise.resolve();
      });

      const mockFn3 = jest.fn().mockImplementation(async () => {
        executionOrder.push(3);
        return Promise.resolve();
      });

      pool.register(mockFn1);
      pool.register(mockFn2);
      pool.register(mockFn3);

      await pool.initializeAll();

      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should handle async functions correctly', async () => {
      const pool = createInitializerPool();
      let flag = false;

      const asyncFn = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        flag = true;
      });

      pool.register(asyncFn);
      await pool.initializeAll();

      expect(asyncFn).toHaveBeenCalledTimes(1);
      expect(flag).toBe(true);
    });

    it('should continue execution even if a function throws an error', async () => {
      const pool = createInitializerPool();
      const mockFn1 = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockFn2 = jest.fn().mockResolvedValue(undefined);

      pool.register(mockFn1);
      pool.register(mockFn2);

      await expect(pool.initializeAll()).rejects.toThrow('Test error');
      expect(mockFn1).toHaveBeenCalledTimes(1);
      expect(mockFn2).not.toHaveBeenCalled();
    });
  });

  describe('serviceInitializerPool singleton', () => {
    it('should be defined', () => {
      expect(serviceInitializerPool).toBeDefined();
      expect(typeof serviceInitializerPool.register).toBe('function');
      expect(typeof serviceInitializerPool.initializeAll).toBe('function');
    });

    it('should be a singleton instance', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined);
      serviceInitializerPool.register(mockFn);
      await serviceInitializerPool.initializeAll();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});
