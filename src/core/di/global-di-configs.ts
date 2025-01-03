import { AppContainer, GlobalContainerConfigEntries } from 'src/core/types';
import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import { Services } from 'src/core';

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
      onInitiate: async (container: AppContainer) => {
        await container
          .resolve<Services.PrismaService>(ContainerTokens.PRISMA)
          .connect();
      },
    },
  },
];

export default globalDIConfigs;
