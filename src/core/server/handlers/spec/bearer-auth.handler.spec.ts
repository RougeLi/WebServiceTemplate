import { FastifyRequest, FastifyReply } from 'fastify';
// import { Environment } from 'src/core/constants';
import { UnauthorizedError } from 'src/core/server/errors';
// import { EnvironmentService } from 'src/core/services';
// import { AppConfigType } from 'src/core/types';
import BearerAuthHandler from '../bearer-auth.handler';

type RoutePattern = { method: string; pattern: RegExp };

// const serviceHeader = 'x-my-service-token';
// const serviceToken = 'dummy-token';

// Mock EnvironmentService
// class MockEnvironmentService extends EnvironmentService {
//   private readonly mockConfig: AppConfigType;
//
//   constructor() {
//     // Mock the required environment variables before calling super()
//     const originalEnv = process.env;
//     process.env = {
//       ...originalEnv,
//       JWT_SECRET: 'test-jwt-secret',
//     };
//
//     // Call super() to properly initialize the parent class
//     super();
//
//     // Restore the original environment
//     process.env = originalEnv;
//
//     // Override the config with our mock values
//     this.mockConfig = {
//       appName: 'test-app',
//       appEnv: Environment.DEVELOPMENT,
//       appPort: 3000,
//       serviceAuthName: serviceHeader,
//       secretKey: serviceToken,
//       jwtSecret: 'test-jwt-secret',
//     };
//   }
//
//   getConfig(): AppConfigType {
//     return this.mockConfig;
//   }
// }

function createBearerAuthHandlerWithPatterns(patterns: RoutePattern[] = []) {
  // Create a BearerAuthHandler instance with mocked EnvironmentService
  // const mockEnvironment = new MockEnvironmentService();
  const auth = new BearerAuthHandler();

  // Register no-auth routes
  patterns.forEach(({ method, pattern }) =>
    auth.registerNoAuthRoute(method, pattern),
  );
  return auth.authorizeMiddleware;
}

const mockRequest = (
  method: string,
  url: string,
  jwtValid: boolean = true,
): [FastifyRequest, jest.Mock] => {
  const jwtVerify = jest.fn().mockImplementation(() => {
    if (!jwtValid) {
      throw new Error('Invalid JWT');
    }
    return Promise.resolve();
  });
  return [
    {
      method,
      url,
      jwtVerify,
      headers: {},
    } as unknown as FastifyRequest,
    jwtVerify,
  ];
};

const mockReply = (): FastifyReply => {
  return {} as FastifyReply;
};

describe('BearerAuthHandler authorizeMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const noAuthPatterns = [
    { method: 'POST', pattern: /^\/login(?:\?.*)?$/ },
    { method: 'GET', pattern: /^\/public(?:\/.*)?$/ },
  ];

  it('should pass through no-auth routes directly', async () => {
    const authorize = createBearerAuthHandlerWithPatterns(noAuthPatterns);

    const [request, jwtVerify] = mockRequest('POST', '/login');
    await expect(authorize(request, mockReply())).resolves.toBeUndefined();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it('should verify JWT for protected routes', async () => {
    const authorize = createBearerAuthHandlerWithPatterns(noAuthPatterns);

    const [request, jwtVerify] = mockRequest('GET', '/protected');
    await expect(authorize(request, mockReply())).resolves.toBeUndefined();
    expect(jwtVerify).toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when JWT verification fails', async () => {
    const authorize = createBearerAuthHandlerWithPatterns(noAuthPatterns);

    const [request, jwtVerify] = mockRequest('GET', '/protected', false);
    await expect(authorize(request, mockReply())).rejects.toThrow(
      UnauthorizedError,
    );
    expect(jwtVerify).toHaveBeenCalled();
  });
});
