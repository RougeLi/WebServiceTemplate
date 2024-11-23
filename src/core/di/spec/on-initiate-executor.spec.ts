import { AppContainer } from 'src/core/types';
import executeOnInitiateHooks from '../on-initiate-executor';

jest.mock('../global-container.config', () => [
  {
    globalContainerConfig: {
      onInitiate: jest.fn().mockResolvedValue(undefined),
    },
  },
  {
    globalContainerConfig: {
      onInitiate: jest.fn().mockRejectedValue(new Error('Test error')),
    },
  },
]);

describe('executeOnInitiateHooks', () => {
  let container: AppContainer;

  beforeEach(() => {
    container = {} as AppContainer;
    jest.clearAllMocks();
  });

  it('should execute all onInitiate hooks', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await executeOnInitiateHooks(container);

    expect(consoleLogSpy).toHaveBeenCalledWith('Executing onInitiate hook...');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error occurred while executing onInitiate hook.',
      ),
    );

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
