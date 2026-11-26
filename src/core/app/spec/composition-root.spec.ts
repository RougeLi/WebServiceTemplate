/**
 * Tests the startup sequence in the root index.ts (the composition root):
 * a failed startup logs the original error, cleans up with app.stop(), logs
 * cleanup errors separately and exits with a non-zero status.
 */
type FakeApp = {
  registerStartupModule: jest.Mock;
  initialize: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  stopSettled: boolean;
};

/**
 * stop() settles only after a timer, so a test can tell whether index.ts
 * waited for cleanup before exiting.
 */
function fakeApp(
  overrides: Partial<Omit<FakeApp, 'stopSettled' | 'stop'>> = {},
  stopError?: Error,
): FakeApp {
  const app: FakeApp = {
    registerStartupModule: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      app.stopSettled = true;
      if (stopError) {
        throw stopError;
      }
    }),
    stopSettled: false,
    ...overrides,
  };
  return app;
}

async function waitFor(condition: () => boolean): Promise<void> {
  for (let i = 0; i < 200 && !condition(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  expect(condition()).toBe(true);
}

async function runIndex(setupApp: jest.Mock, app?: FakeApp) {
  const closeWithGrace = jest.fn();
  const initializeAll = jest.fn().mockResolvedValue(undefined);
  // Whether cleanup had finished when process.exit() was called.
  const stopSettledAtExit: boolean[] = [];
  // process.exit is mocked, so the script keeps running after exit(); in a
  // real process exit() ends it.
  const exit = jest.spyOn(process, 'exit').mockImplementation(((
    code?: number,
  ) => {
    if (code !== 0) {
      stopSettledAtExit.push(app?.stopSettled ?? false);
    }
  }) as never);
  const consoleError = jest.spyOn(console, 'error').mockImplementation();
  jest.spyOn(console, 'log').mockImplementation();

  jest.isolateModules(() => {
    jest.doMock('close-with-grace', () => ({
      __esModule: true,
      default: closeWithGrace,
    }));
    jest.doMock('src/core', () => ({ WebServerModule: jest.fn() }));
    jest.doMock('src/core/app', () => ({ setupApp }));
    jest.doMock('src/core/di', () => ({ globalDIConfigs: [] }));
    jest.doMock('src/core/utils', () => ({
      serviceInitializerPool: { initializeAll },
    }));
    jest.doMock('src/modules', () => ({ __esModule: true, default: [] }));
    // Loading the root index.ts runs its startup IIFE.
    require('index');
  });
  await waitFor(
    () => exit.mock.calls.length > 0 || closeWithGrace.mock.calls.length > 0,
  );

  return {
    closeWithGrace,
    exit,
    consoleError,
    initializeAll,
    stopSettledAtExit,
  };
}

describe('index.ts composition root', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers graceful shutdown after a successful start', async () => {
    const app = fakeApp();
    const { closeWithGrace, exit } = await runIndex(
      jest.fn().mockResolvedValue(app),
      app,
    );

    expect(app.initialize).toHaveBeenCalledTimes(1);
    expect(app.start).toHaveBeenCalledTimes(1);
    expect(app.stop).not.toHaveBeenCalled();
    expect(exit).not.toHaveBeenCalled();
    expect(closeWithGrace).toHaveBeenCalledTimes(1);

    await closeWithGrace.mock.calls[0][0]({ signal: 'SIGTERM' });
    expect(app.stop).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it.each(['initialize', 'start'] as const)(
    'cleans up and exits with 1 when %s() fails, logging the original error',
    async (step) => {
      const original = new Error(`${step} failed`);
      const app = fakeApp({ [step]: jest.fn().mockRejectedValue(original) });
      const { exit, consoleError, stopSettledAtExit } = await runIndex(
        jest.fn().mockResolvedValue(app),
        app,
      );

      expect(consoleError).toHaveBeenNthCalledWith(
        1,
        'APP startup failed:',
        original,
      );
      expect(app.stop).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenCalledWith(1);
      // Cleanup finished before the process exits.
      expect(stopSettledAtExit).toEqual([true]);
      if (step === 'initialize') {
        expect(app.start).not.toHaveBeenCalled();
      }
    },
  );

  it('logs a cleanup failure separately without replacing the original error', async () => {
    const original = new Error('initialize failed');
    const cleanupError = new Error('stop failed');
    const app = fakeApp(
      { initialize: jest.fn().mockRejectedValue(original) },
      cleanupError,
    );
    const { exit, consoleError, stopSettledAtExit } = await runIndex(
      jest.fn().mockResolvedValue(app),
      app,
    );

    expect(consoleError.mock.calls).toEqual([
      ['APP startup failed:', original],
      ['APP cleanup after startup failure failed:', cleanupError],
    ]);
    expect(exit).toHaveBeenCalledWith(1);
    expect(stopSettledAtExit).toEqual([true]);
  });

  it('exits with 1 without cleanup when the application cannot be created', async () => {
    const original = new Error('setup failed');
    const { exit, consoleError, initializeAll } = await runIndex(
      jest.fn().mockRejectedValue(original),
    );

    expect(consoleError).toHaveBeenCalledWith('APP startup failed:', original);
    expect(initializeAll).not.toHaveBeenCalled();
    expect(exit).toHaveBeenCalledWith(1);
  });
});
