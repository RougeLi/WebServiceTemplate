import dotenv from 'dotenv';
import fs from 'fs';
import { loadEnvironment } from '../load-environment';

jest.mock('dotenv');
jest.mock('fs');

describe('loadEnvironment', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should load environment variables successfully when .env exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const mockConfigOutput = { error: undefined };
    (dotenv.config as jest.Mock).mockReturnValue(mockConfigOutput);

    expect(() => loadEnvironment()).not.toThrow();
    expect(fs.existsSync).toHaveBeenCalledWith('.env');
    expect(dotenv.config).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Environment variables loaded from .env file',
    );
  });

  it('should throw an error if dotenv.config fails when .env exists', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const mockError = new Error('Failed to load env');
    (dotenv.config as jest.Mock).mockReturnValue({ error: mockError });

    expect(() => loadEnvironment()).toThrow(mockError);
    expect(fs.existsSync).toHaveBeenCalledWith('.env');
    expect(dotenv.config).toHaveBeenCalled();
  });

  it('should skip dotenv configuration if .env does not exist', () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    expect(() => loadEnvironment()).not.toThrow();
    expect(fs.existsSync).toHaveBeenCalledWith('.env');
    expect(dotenv.config).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '.env file does not exist, skipping dotenv configuration.',
    );
  });
});
