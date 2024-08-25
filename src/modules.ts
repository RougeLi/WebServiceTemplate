import { AppContainer } from 'src/global/types/framework.types';
import IModule from 'src/global/types/module.types';

const modules: IModule[] = [];

export function registerModulesRoutes(container: AppContainer) {
  for (const module of modules) module.registerRoutes(container);
}

export default modules;
