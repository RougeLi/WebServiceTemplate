import { asValue, AwilixContainer } from 'awilix';
import { StatusCodes } from 'http-status-codes';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens, Environment } from 'src/core/constants';
import { WebError } from 'src/core/server';
import { EnvironmentService, LoggerService } from 'src/core/services';
import { AppConfigType } from 'src/core/types';
import { ErrorLoggerHandler } from '../error-logger.handler';

describe('ErrorLoggerHandler', () => {
  let container: AwilixContainer;
  let loggerService: Partial<LoggerService>;
  let environment: Partial<EnvironmentService>;
  let errorLoggerHandler: ErrorLoggerHandler;

  beforeEach(() => {
    container = getTestContainer();

    loggerService = {
      error: jest.fn(),
    };

    environment = {
      getConfig: jest.fn(),
    };

    container.register(ContainerTokens.LOGGER, asValue(loggerService));

    container.register(ContainerTokens.ENVIRONMENT, asValue(environment));
  });

  function setupEnvironment(appEnvironment: Environment | undefined) {
    jest.spyOn(environment, 'getConfig').mockReturnValue({
      appEnv: appEnvironment,
    } as AppConfigType);

    errorLoggerHandler = new ErrorLoggerHandler(
      container.resolve<LoggerService>(ContainerTokens.LOGGER),
      container.resolve<EnvironmentService>(ContainerTokens.ENVIRONMENT),
    );
  }

  it('should log a WebError correctly in development environment', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    const logSpy = jest.spyOn(loggerService, 'error');

    errorLoggerHandler.logError(error);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Test error'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status Code: 400'),
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Stack:'));
  });

  it('should log a WebError correctly in staging environment', () => {
    setupEnvironment(Environment.STAGING);

    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    const logSpy = jest.spyOn(loggerService, 'error');

    errorLoggerHandler.logError(error);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Test error'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status Code: 400'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Stack:'));
  });

  it('should log a WebError correctly in production environment', () => {
    setupEnvironment(Environment.PRODUCTION);

    const error = new WebError(
      StatusCodes.BAD_REQUEST,
      'Test production environment error',
    );
    const logSpy = jest.spyOn(loggerService, 'error');

    errorLoggerHandler.logError(error);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Test production environment error'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Status Code: 400'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Stack:'));
  });

  it('should log a WebError correctly when environment is undefined', () => {
    const environment = undefined;
    setupEnvironment(environment);

    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    const logSpy = jest.spyOn(loggerService, 'error');

    errorLoggerHandler.logError(error);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Test error'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Status Code: 400'),
    );
    expect(logSpy).not.toHaveBeenCalledWith(expect.stringContaining('Stack:'));
  });

  it('should log an internal error with stack trace', () => {
    const error = new Error('Internal error');
    const logSpy = jest.spyOn(loggerService, 'error');

    errorLoggerHandler = new ErrorLoggerHandler(
      container.resolve<LoggerService>(ContainerTokens.LOGGER),
      container.resolve<EnvironmentService>(ContainerTokens.ENVIRONMENT),
    );

    errorLoggerHandler.internalError(error);

    expect(logSpy).toHaveBeenCalledWith(error);
  });
});
