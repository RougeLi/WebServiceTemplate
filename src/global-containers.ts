import { asClass } from 'awilix';
import { LoggerService } from 'src/global/services/logger.service';
import ContainerRegistrations from 'src/global/types/container-registrations.types';
import { EnvironmentService } from './config/environment.service';
import ContainerTokens from './global/container-tokens';

const globalContainers: ContainerRegistrations = [
  [
    ContainerTokens.ENVIRONMENT_SERVICE,
    asClass(EnvironmentService).singleton(),
  ],
  [ContainerTokens.LOGGER, asClass(LoggerService).singleton()],
];

export default globalContainers;
