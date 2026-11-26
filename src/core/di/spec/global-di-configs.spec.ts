import { ContainerTokens } from 'src/core/constants';
import globalDIConfigs from '../global-di-configs';

describe('globalDIConfigs', () => {
  const prismaEntry = globalDIConfigs.find(
    ({ containerTokens }) => containerTokens === ContainerTokens.PRISMA,
  );

  it('should make the Prisma connect hook required', () => {
    expect(prismaEntry?.globalContainerConfig.required).toBe(true);
    expect(typeof prismaEntry?.globalContainerConfig.onInitiate).toBe(
      'function',
    );
  });

  it('should release the Prisma Client through its disposer', async () => {
    const disconnect = jest.fn().mockResolvedValue(undefined);

    await prismaEntry?.globalContainerConfig.onDispose?.({ disconnect });

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('should keep the other global services optional and without disposers', () => {
    for (const { containerTokens, globalContainerConfig } of globalDIConfigs) {
      if (containerTokens === ContainerTokens.PRISMA) {
        continue;
      }
      expect(globalContainerConfig.required).toBeUndefined();
      expect(globalContainerConfig.onDispose).toBeUndefined();
    }
  });
});
