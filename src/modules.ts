import { AppContainer, WebServer } from 'src/global/types/framework.types';
import IModule from 'src/global/types/module.types';

const modules: IModule[] = [];

export function registerModulesRoutes(
  container: AppContainer,
  webServer: WebServer,
) {
  for (const module of modules) module.registerRoutes(container, webServer);
}

export default modules;
