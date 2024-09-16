import dotenv from 'dotenv';
import { loadEnvironment } from 'src/config/load-environment';

jest.mock('dotenv');

describe('loadEnvironment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load environment variables successfully', () => {
    const mockConfigOutput = { error: undefined };
    (dotenv.config as jest.Mock).mockReturnValue(mockConfigOutput);

    expect(() => loadEnvironment()).not.toThrow();
    expect(dotenv.config).toHaveBeenCalled();
  });

  it('should throw an error if dotenv.config fails', () => {
    const mockError = new Error('Failed to load env');
    const mockConfigOutput = { error: mockError };
    (dotenv.config as jest.Mock).mockReturnValue(mockConfigOutput);

    expect(() => loadEnvironment()).toThrow(mockError);
    expect(dotenv.config).toHaveBeenCalled();
  });

  it('should skip .env loading if running inside Docker', () => {
    process.env.IS_DOCKER = 'true';

    expect(() => loadEnvironment()).not.toThrow();
    expect(dotenv.config).not.toHaveBeenCalled();

    delete process.env.IS_DOCKER;
  });
});
