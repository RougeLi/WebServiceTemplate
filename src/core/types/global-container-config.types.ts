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
   * Releases the instance; registered as the resolver's Awilix `.disposer()`.
   * It runs only for instances that were resolved: a singleton when the root
   * container is disposed (Fastify close with `disposeOnClose`), a scoped
   * instance when the scope that resolved it is disposed (per request with
   * `disposeOnResponse`). Transient registrations are never disposed.
   */
  onDispose?(instance: object): unknown;
};

type GlobalContainerConfigEntry = {
  containerTokens: ContainerTokens;
  globalContainerConfig: GlobalContainerConfig;
};

export type GlobalContainerConfigEntries = GlobalContainerConfigEntry[];
