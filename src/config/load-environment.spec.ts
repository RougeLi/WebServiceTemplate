import dotenv from 'dotenv';
import { loadEnvironment } from './load-environment';

jest.mock('dotenv');

describe('loadEnvironment', () => {
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
});
