import { diContainerClassic } from '@fastify/awilix';
import { loadEnvironment } from 'src/config/load-environment';
import { AppContainer } from 'src/global/types/framework.types';
import globalContainers from 'src/global-containers';
import modules from 'src/modules';
import { IApplication } from './app.types';
import Application from './application';
import { initializeContainer } from './di-container';

async function setupApp(): Promise<IApplication> {
  loadEnvironment();

  const container = initializeContainer(diContainerClassic);

  registerContainers(container);

  registerModules(container);

  return new Application(container);
}

function registerContainers(container: AppContainer): void {
  for (const globalContainer of globalContainers) {
    const [token, resolver] = globalContainer;
    container.register(token, resolver);
  }
}

function registerModules(container: AppContainer): void {
  for (const module of modules) {
    const registrations = module.getRegisterDependencies();
    for (const [token, resolver] of registrations) {
      container.register(token, resolver);
    }
  }
}

export default setupApp;
