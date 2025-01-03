import closeWithGrace from 'close-with-grace';
import 'reflect-metadata';
import { Services } from 'src/core';
import { setupApp } from 'src/core/app';
import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import {
  AppContainer,
  GlobalContainerConfigEntries,
  IModule,
} from 'src/core/types';

const globalContainerConfigEntries: GlobalContainerConfigEntries = [
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

const modules: IModule[] = [];

(async () => {
  const app = await setupApp(globalContainerConfigEntries, modules);
  await app.initialize();
  await app.start();

  closeWithGrace(async () => {
    console.log('APP starting shutdown.');
  });
})();
