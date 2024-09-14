import { asClass } from 'awilix'; // Properly import asClass
import ContainerTokens from 'src/global/container-tokens';
import { InjectionResolverMode } from 'src/global/types/framework.types';
import {
  makeDependencyRegistration,
  makeContainerRegistration,
} from 'src/global/utils/di-registration-factory';

jest.mock('awilix', () => ({
  asClass: jest.fn().mockReturnValue({
    singleton: jest.fn(),
    scoped: jest.fn(),
    transient: jest.fn(),
    proxy: jest.fn(),
    classic: jest.fn(),
  }),
}));

class MockService {}

class AnotherService {}

describe('DI Registration Factory', () => {
  describe('makeDependencyRegistration', () => {
    it('should create a singleton dependency registration', () => {
      const result = makeDependencyRegistration(
        'mockToken',
        MockService,
        InjectionResolverMode.SINGLETON,
      );
      expect(result[0]).toBe('mockToken');
      expect(asClass).toHaveBeenCalledWith(MockService);
      expect(asClass(MockService).singleton).toHaveBeenCalled();
    });

    it('should create a scoped dependency registration', () => {
      const result = makeDependencyRegistration(
        'mockToken',
        MockService,
        InjectionResolverMode.SCOPED,
      );
      expect(result[0]).toBe('mockToken');
      expect(asClass).toHaveBeenCalledWith(MockService);
      expect(asClass(MockService).scoped).toHaveBeenCalled();
    });

    it('should create a transient dependency registration', () => {
      const result = makeDependencyRegistration(
        'mockToken',
        MockService,
        InjectionResolverMode.TRANSIENT,
      );

      expect(result[0]).toBe('mockToken');
      expect(asClass).toHaveBeenCalledWith(MockService);
      expect(asClass(MockService).transient).toHaveBeenCalled();
    });

    it('should create a proxy dependency registration', () => {
      const result = makeDependencyRegistration(
        'mockToken',
        MockService,
        InjectionResolverMode.PROXY,
      );

      expect(result[0]).toBe('mockToken');
      expect(asClass).toHaveBeenCalledWith(MockService);
      expect(asClass(MockService).proxy).toHaveBeenCalled();
    });

    it('should create a classic dependency registration', () => {
      const result = makeDependencyRegistration(
        'mockToken',
        MockService,
        InjectionResolverMode.CLASSIC,
      );

      expect(result[0]).toBe('mockToken');
      expect(asClass).toHaveBeenCalledWith(MockService);
      expect(asClass(MockService).classic).toHaveBeenCalled();
    });

    it('should return default registration when unknown injection mode is provided', () => {
      const result = makeDependencyRegistration(
        'mockToken',
        MockService,
        'UNKNOWN_MODE' as InjectionResolverMode,
      );

      expect(result[0]).toBe('mockToken');
      expect(asClass).toHaveBeenCalledWith(MockService);
      expect(asClass(MockService).singleton).not.toHaveBeenCalled();
    });
  });

  describe('makeContainerRegistration', () => {
    it('should create a singleton container registration', () => {
      const result = makeContainerRegistration(
        ContainerTokens.LOGGER,
        AnotherService,
        InjectionResolverMode.SINGLETON,
      );

      expect(result[0]).toBe(ContainerTokens.LOGGER);
      expect(asClass).toHaveBeenCalledWith(AnotherService);
      expect(asClass(AnotherService).singleton).toHaveBeenCalled();
    });

    it('should create a scoped container registration', () => {
      const result = makeContainerRegistration(
        ContainerTokens.LOGGER,
        AnotherService,
        InjectionResolverMode.SCOPED,
      );

      expect(result[0]).toBe(ContainerTokens.LOGGER);
      expect(asClass).toHaveBeenCalledWith(AnotherService);
      expect(asClass(AnotherService).scoped).toHaveBeenCalled();
    });

    it('should create a transient container registration', () => {
      const result = makeContainerRegistration(
        ContainerTokens.LOGGER,
        AnotherService,
        InjectionResolverMode.TRANSIENT,
      );

      expect(result[0]).toBe(ContainerTokens.LOGGER);
      expect(asClass).toHaveBeenCalledWith(AnotherService);
      expect(asClass(AnotherService).transient).toHaveBeenCalled();
    });

    it('should create a proxy container registration', () => {
      const result = makeContainerRegistration(
        ContainerTokens.LOGGER,
        AnotherService,
        InjectionResolverMode.PROXY,
      );

      expect(result[0]).toBe(ContainerTokens.LOGGER);
      expect(asClass).toHaveBeenCalledWith(AnotherService);
      expect(asClass(AnotherService).proxy).toHaveBeenCalled();
    });

    it('should create a classic container registration', () => {
      const result = makeContainerRegistration(
        ContainerTokens.LOGGER,
        AnotherService,
        InjectionResolverMode.CLASSIC,
      );

      expect(result[0]).toBe(ContainerTokens.LOGGER);
      expect(asClass).toHaveBeenCalledWith(AnotherService);
      expect(asClass(AnotherService).classic).toHaveBeenCalled();
    });

    it('should return default container registration when unknown injection mode is provided', () => {
      const result = makeContainerRegistration(
        ContainerTokens.LOGGER,
        AnotherService,
        'UNKNOWN_MODE' as InjectionResolverMode,
      );

      expect(result[0]).toBe(ContainerTokens.LOGGER);
      expect(asClass).toHaveBeenCalledWith(AnotherService);
      expect(asClass(AnotherService).singleton).not.toHaveBeenCalled();
    });
  });
});
