import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import { AppContainer, ClassType } from './di.types';

type GlobalContainerConfig = {
  service: ClassType;
  mode: InjectionResolverMode;
  onInitiate?: (container: AppContainer) => Promise<void>;
  /**
   * When true, an `onInitiate` failure rejects `Application.initialize()`
   * (after every other hook has settled). Hooks without this flag keep the
   * default contract: the failure is logged and initialization continues.
   */
  required?: boolean;
  /**
   * Releases the instance when the container is disposed (for example by
   * Fastify close with `disposeOnClose`). Registered as the resolver's Awilix
   * `.disposer()`, so it only runs for instances that were resolved, and only
   * for singleton or scoped registrations.
   */
  onDispose?(instance: object): unknown;
};

type GlobalContainerConfigEntry = {
  containerTokens: ContainerTokens;
  globalContainerConfig: GlobalContainerConfig;
};

export type GlobalContainerConfigEntries = GlobalContainerConfigEntry[];
