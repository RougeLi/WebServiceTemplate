import { diContainer } from '@fastify/awilix';
import { AwilixContainer } from 'awilix';
import { loadEnvironment } from 'src/config';
import globalContainers from 'src/global-containers';
import modules from 'src/modules';
import { IApplication } from './app.types';
import Application from './application';
import { initializeContainer } from './di-container';

async function setupApp(): Promise<IApplication> {
  loadEnvironment();

  const container = initializeContainer(diContainer);

  registerContainers(container);

  registerModules(container);

  return new Application(container);
}

function registerContainers(container: AwilixContainer): void {
  for (const globalContainer of globalContainers) {
    const [name, registration] = globalContainer;
    container.register(name, registration);
  }
}

function registerModules(container: AwilixContainer): void {
  for (const module of modules) {
    const registrations = module.registerDependencies();
    for (const { name, registration } of registrations) {
      container.register(name, registration);
    }
  }
}

export default setupApp;
