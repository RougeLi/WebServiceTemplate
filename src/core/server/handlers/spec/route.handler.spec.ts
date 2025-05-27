import { AppContainer, IRoute, WebServer } from 'src/core/types';
import { isRouteClass } from 'src/core/utils';
import { getAccessLevel } from 'src/core/utils/base.route';
import {
  clearRouteTokens,
  getRouteTokens,
  registerRouteToken,
  registerRoutes,
} from '../route.handler';

// Correctly mock utils/base.route
jest.mock('src/core/utils/base.route', () => ({
  getAccessLevel: jest.fn(),
  AccessLevel: jest.fn(),
  UNMARKED_ACCESS: 'unmarked',
}));

// Correctly mock src/core/utils
jest.mock('src/core/utils', () => ({
  isRouteClass: jest.fn().mockReturnValue(true),
  UNMARKED_ACCESS: 'unmarked',
}));

class MockRoute implements IRoute {
  registerRoutes = jest.fn();
}

class NonRouteClass {}

describe('Route Handler', () => {
  const token = 'mockToken';
  let mockContainer: AppContainer;
  let mockWebServer: WebServer;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock console methods once for all tests
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Reset ROUTE_TOKENS and mock functions to ensure test independence
    clearRouteTokens();
    jest.resetAllMocks();

    mockContainer = {
      resolve: jest.fn(),
    } as unknown as AppContainer;

    mockWebServer = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as WebServer;
  });

  afterAll(() => {
    // Ensure console methods are restored after all tests
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('registerRouteToken', () => {
    it('should register route token when class implements IRoute', () => {
      (isRouteClass as jest.Mock).mockReturnValue(true);
      registerRouteToken(token, MockRoute);
      expect(getRouteTokens()).toContain(token);
      expect(isRouteClass).toHaveBeenCalledWith(MockRoute);
    });

    it('should not register route token when class does not implement IRoute', () => {
      (isRouteClass as jest.Mock).mockReturnValue(false);
      registerRouteToken(token, NonRouteClass);
      expect(getRouteTokens()).not.toContain(token);
      expect(isRouteClass).toHaveBeenCalledWith(NonRouteClass);
    });
  });

  describe('registerRoutes', () => {
    it('should register all routes when no access tags are provided', () => {
      // Manually simulate ROUTE_TOKENS containing a value
      (isRouteClass as jest.Mock).mockReturnValue(true);
      registerRouteToken(token, MockRoute);

      // Ensure getRouteTokens returns the array containing our token
      expect(getRouteTokens()).toContain(token);

      (getAccessLevel as jest.Mock).mockReturnValue('ANY_LEVEL');
      const routeInstance = new MockRoute();
      (mockContainer.resolve as jest.Mock).mockReturnValue(routeInstance);

      registerRoutes(mockContainer, mockWebServer);

      expect(mockContainer.resolve).toHaveBeenCalledWith(token);
      expect(routeInstance.registerRoutes).toHaveBeenCalledWith(mockWebServer);
    });

    it('should register route when its access level is in allowedTags', () => {
      const allowedLevel = 'ALLOWED';
      // Manually simulate ROUTE_TOKENS containing a value
      (isRouteClass as jest.Mock).mockReturnValue(true);
      registerRouteToken(token, MockRoute);

      (getAccessLevel as jest.Mock).mockReturnValue(allowedLevel);
      const routeInstance = new MockRoute();
      (mockContainer.resolve as jest.Mock).mockReturnValue(routeInstance);

      registerRoutes(mockContainer, mockWebServer, [allowedLevel]);

      expect(mockContainer.resolve).toHaveBeenCalledWith(token);
      expect(routeInstance.registerRoutes).toHaveBeenCalledWith(mockWebServer);
    });

    it('should skip route when its access level is not in allowedTags', () => {
      const disallowedLevel = 'DISALLOWED';
      // Manually simulate ROUTE_TOKENS containing a value
      (isRouteClass as jest.Mock).mockReturnValue(true);
      registerRouteToken(token, MockRoute);

      (getAccessLevel as jest.Mock).mockReturnValue(disallowedLevel);
      const routeInstance = new MockRoute();
      (mockContainer.resolve as jest.Mock).mockReturnValue(routeInstance);

      registerRoutes(mockContainer, mockWebServer, ['ALLOWED']);

      expect(mockContainer.resolve).toHaveBeenCalledWith(token);
      expect(routeInstance.registerRoutes).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`▸ Skip [${disallowedLevel}]`),
      );
    });

    it('should display warning and register no routes when ROUTE_TOKENS is empty', () => {
      // Explicitly ensure ROUTE_TOKENS is empty
      clearRouteTokens();

      registerRoutes(mockContainer, mockWebServer);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Warning: No routes have been registered. The API will have no endpoints.',
      );
      // Confirm no attempt to resolve any routes
      expect(mockContainer.resolve).not.toHaveBeenCalled();
    });
  });
});
