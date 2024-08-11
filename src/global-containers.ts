import { asClass } from 'awilix';
import ContainerRegistrationTypes from 'src/global/types/container-registrations.types';
import { EnvironmentService } from './config/environment.service';
import ContainerTokens from './global/container-tokens';

const globalContainers: ContainerRegistrationTypes = [
  [ContainerTokens.APP_CONFIG, asClass(EnvironmentService).singleton()],
];

export default globalContainers;
