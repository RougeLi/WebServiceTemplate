import dotenv from 'dotenv';
import { loadEnvironment } from 'src/config/load-environment';

jest.mock('dotenv');

describe('loadEnvironment', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should load environment variables successfully', () => {
    const mockConfigOutput = { error: undefined };
    (dotenv.config as jest.Mock).mockReturnValue(mockConfigOutput);

    expect(() => loadEnvironment()).not.toThrow();
    expect(dotenv.config).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Environment variables loaded from .env file',
    );
  });

  it('should throw an error if dotenv.config fails', () => {
    const mockError = new Error('Failed to load env');
    const mockConfigOutput = { error: mockError };
    (dotenv.config as jest.Mock).mockReturnValue(mockConfigOutput);

    expect(() => loadEnvironment()).toThrow(mockError);
    expect(dotenv.config).toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should skip .env loading if running inside Docker', () => {
    process.env.IS_DOCKER = 'true';

    expect(() => loadEnvironment()).not.toThrow();
    expect(dotenv.config).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Running inside Docker, skipping .env loading',
    );

    delete process.env.IS_DOCKER;
  });
});
