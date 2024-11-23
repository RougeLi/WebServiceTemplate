import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import { AppContainer, ClassType } from 'src/core/types/di.types';

type GlobalContainerConfig = {
  service: ClassType;
  mode: InjectionResolverMode;
  onInitiate?: (container: AppContainer) => Promise<void>;
};

type GlobalContainerConfigEntry = {
  containerTokens: ContainerTokens;
  globalContainerConfig: GlobalContainerConfig;
};

export type GlobalContainerConfigEntries = GlobalContainerConfigEntry[];
