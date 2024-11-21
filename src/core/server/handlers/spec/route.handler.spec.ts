import { AppContainer, IRoute, WebServer } from 'src/core/types';
import { isRouteClass } from 'src/core/utils';
import {
  registerRoutes,
  registerRouteToken,
  ROUTE_TOKENS,
} from '../route.handler';

jest.mock('src/core/utils/base.route', () => ({
  isRouteClass: jest.fn(),
}));

const mockContainer = {
  resolve: jest.fn(),
} as unknown as AppContainer;

const mockWebServer = {
  get: jest.fn(),
} as unknown as WebServer;

class MockRoute implements IRoute {
  registerRoutes = jest.fn();
}

class NonRouteClass {}

describe('Route Handler', () => {
  beforeEach(() => {
    ROUTE_TOKENS.length = 0;
  });

  describe('registerRouteToken', () => {
    it('should register the route token if the class implements IRoute', () => {
      (isRouteClass as jest.Mock).mockReturnValue(true);

      registerRouteToken('mockToken', MockRoute);

      expect(ROUTE_TOKENS).toContain('mockToken');
      expect(isRouteClass).toHaveBeenCalledWith(MockRoute);
    });

    it('should not register the route token if the class does not implement IRoute', () => {
      (isRouteClass as jest.Mock).mockReturnValue(false);

      registerRouteToken('mockToken', NonRouteClass);

      expect(ROUTE_TOKENS).not.toContain('mockToken');
      expect(isRouteClass).toHaveBeenCalledWith(NonRouteClass);
    });
  });

  describe('registerRoutes', () => {
    it('should register all routes from ROUTE_TOKENS with the Fastify web server', () => {
      ROUTE_TOKENS.push('mockToken');

      mockContainer.resolve = jest.fn().mockReturnValue(new MockRoute());

      registerRoutes(mockContainer, mockWebServer);

      expect(mockContainer.resolve).toHaveBeenCalledWith('mockToken');

      const resolvedRoute = mockContainer.resolve('mockToken');
      expect(resolvedRoute.registerRoutes).toHaveBeenCalledWith(mockWebServer);
    });

    it('should not throw if ROUTE_TOKENS is empty', () => {
      expect(() => {
        registerRoutes(mockContainer, mockWebServer);
      }).not.toThrow();
    });
  });
});
