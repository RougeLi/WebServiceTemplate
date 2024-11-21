import { ContainerTokens, InjectionResolverMode } from 'src/core/constants';
import { EnvironmentService, LoggerService } from 'src/core/services';
import { ContainerRegistrations } from 'src/core/types';
import { makeContainerRegistration } from 'src/core/utils';

const globalContainers: ContainerRegistrations = [
  // Registering the environment service
  makeContainerRegistration(
    ContainerTokens.ENVIRONMENT_SERVICE,
    EnvironmentService,
    InjectionResolverMode.SINGLETON,
  ),

  // Registering the logger service
  makeContainerRegistration(
    ContainerTokens.LOGGER,
    LoggerService,
    InjectionResolverMode.SINGLETON,
  ),
];

export default globalContainers;
