import { asValue, AwilixContainer } from 'awilix';
import { StatusCodes } from 'http-status-codes';
import { AppConfigType } from 'src/config/app-config.types';
import { EnvironmentService } from 'src/config/environment.service';
import ContainerTokens from 'src/global/container-tokens';
import { LoggerService } from 'src/global/services/logger.service';
import { Environment } from 'src/global/types/environment.types';
import { ErrorLoggerHandler } from 'src/server/handlers/error-logger.handler';
import { WebError } from 'src/server/web.error';
import { getTestContainer } from 'tests/container.mock';

describe('ErrorLoggerHandler', () => {
  let container: AwilixContainer;
  let loggerService: Partial<LoggerService>;
  let environmentService: Partial<EnvironmentService>;
  let errorLoggerHandler: ErrorLoggerHandler;

  beforeEach(() => {
    container = getTestContainer();

    loggerService = {
      error: jest.fn(),
    };

    environmentService = {
      getConfig: jest.fn(),
    };

    container.register(ContainerTokens.LOGGER, asValue(loggerService));

    container.register(
      ContainerTokens.ENVIRONMENT_SERVICE,
      asValue(environmentService),
    );
  });

  function setupEnvironment(appEnvironment: Environment | undefined) {
    jest.spyOn(environmentService, 'getConfig').mockReturnValue({
      appEnv: appEnvironment,
    } as AppConfigType);

    errorLoggerHandler = new ErrorLoggerHandler(
      container.resolve<LoggerService>(ContainerTokens.LOGGER),
      container.resolve<EnvironmentService>(
        ContainerTokens.ENVIRONMENT_SERVICE,
      ),
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
      container.resolve<EnvironmentService>(
        ContainerTokens.ENVIRONMENT_SERVICE,
      ),
    );

    errorLoggerHandler.internalError(error);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Internal error'),
    );
  });
});
