import { LoggerService } from 'src/global/services/logger.service';
import ContainerRegistrations from 'src/global/types/container-registrations.types';
import { InjectionResolverMode } from 'src/global/types/framework.types';
import { makeContainerRegistration } from 'src/global/utils/di-registration-factory';
import { EnvironmentService } from './config/environment.service';
import ContainerTokens from './global/container-tokens';

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
