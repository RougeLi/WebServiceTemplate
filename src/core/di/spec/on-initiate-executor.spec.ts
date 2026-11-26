import { AppContainer, GlobalContainerConfigEntries } from 'src/core/types';
import executeOnInitiateHooks from '../on-initiate-executor';

describe('executeOnInitiateHooks', () => {
  let container: AppContainer;

  beforeEach(() => {
    container = {} as AppContainer;
    jest.clearAllMocks();
  });

  it('should execute all onInitiate hooks', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await executeOnInitiateHooks(container, [
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
    ] as unknown as GlobalContainerConfigEntries);

    expect(consoleLogSpy).toHaveBeenCalledWith('Executing onInitiate hook...');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'Error occurred while executing onInitiate hook.',
      ),
    );

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('required hooks', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    const entry = (
      onInitiate: () => Promise<void>,
      required?: boolean,
    ): GlobalContainerConfigEntries[number] =>
      ({
        globalContainerConfig: { onInitiate, required },
      }) as unknown as GlobalContainerConfigEntries[number];

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    it('should reject with the original error when a required hook fails', async () => {
      const original = new Error('required failure');

      await expect(
        executeOnInitiateHooks(container, [
          entry(async () => {
            throw original;
          }, true),
        ]),
      ).rejects.toBe(original);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error occurred while executing required onInitiate hook.',
        ),
      );
    });

    it('should wait for every other hook before rejecting', async () => {
      const finished: string[] = [];

      await expect(
        executeOnInitiateHooks(container, [
          entry(async () => {
            throw new Error('fast required failure');
          }, true),
          entry(async () => {
            await delay(30);
            finished.push('slow optional');
          }),
          entry(async () => {
            await delay(20);
            finished.push('slow required');
          }, true),
        ]),
      ).rejects.toThrow('fast required failure');
      expect(finished.sort()).toEqual(['slow optional', 'slow required']);
    });

    it('should keep the first required failure when several fail', async () => {
      const first = new Error('first');
      const second = new Error('second');

      await expect(
        executeOnInitiateHooks(container, [
          entry(async () => {
            await delay(20);
            throw second;
          }, true),
          entry(async () => {
            throw first;
          }, true),
        ]),
      ).rejects.toBe(first);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it('should not reject when only hooks that are not required fail', async () => {
      await expect(
        executeOnInitiateHooks(container, [
          entry(async () => {
            throw new Error('optional failure');
          }),
          entry(async () => {
            throw new Error('explicitly optional failure');
          }, false),
          entry(async () => {}, true),
        ]),
      ).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    const revoked = Proxy.revocable({}, {});
    revoked.revoke();

    it.each([
      ['a revoked proxy', revoked.proxy],
      ['undefined', undefined],
      ['null', null],
      ['a string', 'plain failure'],
      ['an object without a prototype', Object.create(null)],
      [
        'an object whose toString throws',
        {
          toString() {
            throw new Error('boom');
          },
        },
      ],
    ])(
      'should still wait for every hook when a hook rejects with %s',
      async (_label, value) => {
        let slowHookFinished = false;
        const slowHook = entry(async () => {
          await delay(20);
          slowHookFinished = true;
        });

        await expect(
          executeOnInitiateHooks(container, [
            entry(() => Promise.reject(value)),
            slowHook,
          ]),
        ).resolves.toBeUndefined();
        expect(slowHookFinished).toBe(true);

        slowHookFinished = false;
        await expect(
          executeOnInitiateHooks(container, [
            entry(() => Promise.reject(value), true),
            slowHook,
          ]),
        ).rejects.toBe(value);
        expect(slowHookFinished).toBe(true);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error occurred while executing'),
        );
      },
    );

    it('should skip entries without an onInitiate hook', async () => {
      await expect(
        executeOnInitiateHooks(container, [
          { globalContainerConfig: { required: true } },
        ] as unknown as GlobalContainerConfigEntries),
      ).resolves.toBeUndefined();
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
