import { diContainerClassic } from '@fastify/awilix';
import { loadEnvironment, DI } from 'src/core';
import { AppContainer, IModule } from 'src/core/types';
import { IApplication } from './app.types';
import Application from './application';
import { initializeContainer } from './di-container';

export default async function setupApp(
  modules: IModule[],
): Promise<IApplication> {
  loadEnvironment();

  const container = initializeContainer(diContainerClassic);

  registerContainers(container);

  registerModules(modules, container);

  return new Application(container);
}

function registerContainers(container: AppContainer): void {
  for (const globalContainer of DI.globalContainers) {
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
