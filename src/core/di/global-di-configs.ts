import { Services } from 'src/core';
import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import { AppContainer, GlobalContainerConfigEntries } from 'src/core/types';

const globalDIConfigs: GlobalContainerConfigEntries = [
  // Environment Service
  {
    containerTokens: ContainerTokens.ENVIRONMENT,
    globalContainerConfig: {
      service: Services.EnvironmentService,
      mode: InjectionResolverMode.SINGLETON,
    },
  },

  // Logger Service
  {
    containerTokens: ContainerTokens.LOGGER,
    globalContainerConfig: {
      service: Services.LoggerService,
      mode: InjectionResolverMode.SINGLETON,
    },
  },

  // Prisma Config Service
  {
    containerTokens: ContainerTokens.PRISMA_CONFIG,
    globalContainerConfig: {
      service: Services.PrismaConfigService,
      mode: InjectionResolverMode.SINGLETON,
    },
  },

  // Prisma Service
  {
    containerTokens: ContainerTokens.PRISMA,
    globalContainerConfig: {
      service: Services.PrismaService,
      mode: InjectionResolverMode.SINGLETON,
      // A database that is not ready stops startup instead of being logged.
      required: true,
      onInitiate: async (container: AppContainer) => {
        await container
          .resolve<Services.PrismaService>(ContainerTokens.PRISMA)
          .connect();
      },
      // The singleton's disposer is the only owner of the Client and its pool;
      // container.dispose() (Fastify close) runs it once.
      onDispose: async (prisma: Services.PrismaService) => {
        await prisma.disconnect();
      },
    },
  },
];

export default globalDIConfigs;
