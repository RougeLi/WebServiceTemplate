import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from 'src/core/server/errors';
import { EnvironmentService, LoggerService } from 'src/core/services';
import SecretAuthHandler from '../secret-auth.handler';

// Mock EnvironmentService
class MockEnvironmentService {
  getConfig() {
    return {
      serviceAuthName: 'x-service-auth',
      secretKey: 'test-secret-key',
    };
  }
}

// Create mock request
const createMockRequest = (headers = {}, url = '/test-url'): FastifyRequest => {
  return {
    headers,
    url,
  } as unknown as FastifyRequest;
};

// Create a mock reply
const createMockReply = (): FastifyReply => {
  return {} as FastifyReply;
};

describe('SecretAuthHandler', () => {
  let secretAuthHandler: SecretAuthHandler;
  let mockEnvironmentService: EnvironmentService;
  let mockLoggerService: LoggerService;

  beforeEach(() => {
    // Create a mock logger service
    mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerService;

    // Create a mock environment service
    mockEnvironmentService =
      new MockEnvironmentService() as unknown as EnvironmentService;

    // Create a SecretAuthHandler instance with mocked services
    secretAuthHandler = new SecretAuthHandler(
      mockEnvironmentService,
      mockLoggerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authorizeMiddleware', () => {
    it('should pass when the secret key is valid', async () => {
      // Arrange
      const request = createMockRequest({
        'x-service-auth': 'test-secret-key',
      });

      // Act & Assert
      await expect(
        secretAuthHandler.authorizeMiddleware(request, createMockReply()),
      ).resolves.toBeUndefined();

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining('SUCCESS'),
      );
    });

    it('should throw UnauthorizedError when the secret key is invalid', async () => {
      // Arrange
      const request = createMockRequest({
        'x-service-auth': 'wrong-secret-key',
      });

      // Act & Assert
      await expect(
        secretAuthHandler.authorizeMiddleware(request, createMockReply()),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
      );
    });

    it('should throw UnauthorizedError when the secret key is missing', async () => {
      // Arrange
      const request = createMockRequest({});

      // Act & Assert
      await expect(
        secretAuthHandler.authorizeMiddleware(request, createMockReply()),
      ).rejects.toThrow(UnauthorizedError);

      expect(mockLoggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
      );
    });
  });

  describe('validateSecretKey', () => {
    it('should return true when the secret key is valid', () => {
      // Act
      const result = secretAuthHandler.validateSecretKey('test-secret-key');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when the secret key is invalid', () => {
      // Act
      const result = secretAuthHandler.validateSecretKey('wrong-secret-key');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when the secret key is undefined', () => {
      // Act
      const result = secretAuthHandler.validateSecretKey(undefined);

      // Assert
      expect(result).toBe(false);
    });
  });
});
