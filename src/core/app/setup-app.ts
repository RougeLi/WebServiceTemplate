import { diContainerClassic } from '@fastify/awilix';
import { loadEnvironment, makeContainerRegistration } from 'src/core';
import { initializeContainer } from 'src/core/di';
import {
  AppContainer,
  GlobalContainerConfigEntries,
  IModule,
} from 'src/core/types';
import { IApplication } from './app.types';
import Application from './application';

export default async function setupApp(
  globalContainerConfigEntries: GlobalContainerConfigEntries,
  modules: IModule[],
): Promise<IApplication> {
  loadEnvironment();

  const container = initializeContainer(diContainerClassic);

  registerContainers(container, globalContainerConfigEntries);

  registerModules(modules, container);

  return new Application(container, globalContainerConfigEntries);
}

function registerContainers(
  container: AppContainer,
  globalContainerConfigEntries: GlobalContainerConfigEntries,
): void {
  const globalContainers = globalContainerConfigEntries.map(
    ({ containerTokens, globalContainerConfig }) =>
      makeContainerRegistration(
        containerTokens,
        globalContainerConfig.service,
        globalContainerConfig.mode,
      ),
  );

  for (const globalContainer of globalContainers) {
    const [token, resolver] = globalContainer;
    container.register(token, resolver);
  }
}

function registerModules(modules: IModule[], container: AppContainer): void {
  for (const module of modules) {
    const registrations = module.getRegisterDependencies();
    for (const [token, resolver] of registrations) {
      container.register(token, resolver);
    }
  }
}
