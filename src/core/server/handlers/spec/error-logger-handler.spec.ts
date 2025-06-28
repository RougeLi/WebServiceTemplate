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
      info: jest.fn(),
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
    const logSpy = jest.spyOn(loggerService, 'info');

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
    const logSpy = jest.spyOn(loggerService, 'info');

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
    const logSpy = jest.spyOn(loggerService, 'info');

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
    const logSpy = jest.spyOn(loggerService, 'info');

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

  it('should initialize config in constructor', () => {
    const mockConfig = { appEnv: Environment.DEVELOPMENT };
    jest
      .spyOn(environment, 'getConfig')
      .mockReturnValue(mockConfig as AppConfigType);

    errorLoggerHandler = new ErrorLoggerHandler(
      container.resolve<LoggerService>(ContainerTokens.LOGGER),
      container.resolve<EnvironmentService>(ContainerTokens.ENVIRONMENT),
    );

    expect(environment.getConfig).toHaveBeenCalled();
    // Verify the private config property is initialized correctly
    expect((errorLoggerHandler as any).config).toEqual(mockConfig);
  });

  it('should handle internal server errors correctly', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    const internalServerError = new WebError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Internal server error',
    );
    const logSpy = jest.spyOn(loggerService, 'info');

    errorLoggerHandler.logError(internalServerError);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Internal Server Error: Internal server error'),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Status Code: 500'),
    );
  });

  it('should directly test logError method implementation', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    // Create a spy on the private formatError method
    const formatErrorSpy = jest
      .spyOn(ErrorLoggerHandler.prototype as any, 'formatError')
      .mockReturnValue('Formatted error message');

    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    const logSpy = jest.spyOn(loggerService, 'info');

    errorLoggerHandler.logError(error);

    // Verify formatError was called with the error
    expect(formatErrorSpy).toHaveBeenCalledWith(error);

    // Verify logger.info was called with the formatted error
    expect(logSpy).toHaveBeenCalledWith('Formatted error message');

    // Restore the original implementation
    formatErrorSpy.mockRestore();
  });

  it('should handle application notice errors correctly', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    // Use a status code outside the client error (400-499) and server error (500-599) ranges
    const applicationNoticeError = new WebError(300, 'Application notice');
    const logSpy = jest.spyOn(loggerService, 'info');

    errorLoggerHandler.logError(applicationNoticeError);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Application Notice: Application notice'),
    );
  });

  it('should test formatError method directly', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');

    // Access the private formatError method
    const formattedError = (errorLoggerHandler as any).formatError(error);

    expect(formattedError).toContain('Client Request Error: Test error');
    expect(formattedError).toContain('Status Code: 400');
    expect(formattedError).toContain('Stack:');
  });

  it('should test formatError method with different environments', () => {
    // Test with a STAGING environment
    setupEnvironment(Environment.STAGING);
    let error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    let formattedError = (errorLoggerHandler as any).formatError(error);

    expect(formattedError).toContain('Client Request Error: Test error');
    expect(formattedError).toContain('Status Code: 400');
    expect(formattedError).not.toContain('Stack:');

    // Test with PRODUCTION environment
    setupEnvironment(Environment.PRODUCTION);
    error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    formattedError = (errorLoggerHandler as any).formatError(error);

    expect(formattedError).toBe('Client Request Error: Test error');
    expect(formattedError).not.toContain('Status Code: 400');
    expect(formattedError).not.toContain('Stack:');
  });

  it('should test formatError method with different error types', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    // Test with server error
    let error = new WebError(StatusCodes.INTERNAL_SERVER_ERROR, 'Server error');
    let formattedError = (errorLoggerHandler as any).formatError(error);

    expect(formattedError).toContain('Internal Server Error: Server error');
    expect(formattedError).toContain('Status Code: 500');

    // Test with client error
    error = new WebError(StatusCodes.BAD_REQUEST, 'Client error');
    formattedError = (errorLoggerHandler as any).formatError(error);

    expect(formattedError).toContain('Client Request Error: Client error');
    expect(formattedError).toContain('Status Code: 400');

    // Test with application notice
    error = new WebError(300, 'Application notice');
    formattedError = (errorLoggerHandler as any).formatError(error);

    expect(formattedError).toContain('Application Notice: Application notice');
    expect(formattedError).toContain('Status Code: 300');
  });

  it('should verify logError method signature', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    // Verify the method exists and is a function
    expect(typeof errorLoggerHandler.logError).toBe('function');

    // Spy on the logger to verify it's called correctly
    const logSpy = jest.spyOn(loggerService, 'info');
    const formatSpy = jest.spyOn(errorLoggerHandler as any, 'formatError');

    const error = new WebError(StatusCodes.BAD_REQUEST, 'Test error');
    errorLoggerHandler.logError(error);

    // Verify the method calls formatError and then logs the result
    expect(formatSpy).toHaveBeenCalledWith(error);
    expect(logSpy).toHaveBeenCalled();
  });

  it('should verify internalError method signature', () => {
    setupEnvironment(Environment.DEVELOPMENT);

    // Verify the method exists and is a function
    expect(typeof errorLoggerHandler.internalError).toBe('function');

    // Spy on the logger to verify it's called correctly
    const logSpy = jest.spyOn(loggerService, 'error');

    const error = new Error('Internal error');
    errorLoggerHandler.internalError(error);

    // Verify the method logs the error directly
    expect(logSpy).toHaveBeenCalledWith(error);
  });
});
