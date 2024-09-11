import { asValue, AwilixContainer, createContainer } from 'awilix';
import ContainerTokens from 'src/global/container-tokens';
import { getEnvironmentServiceMock } from './environment.mock';
import { getLoggerServiceMock } from './logger.mock';

export const getTestContainer = (): AwilixContainer => {
  const container = createContainer();

  container.register(
    ContainerTokens.ENVIRONMENT_SERVICE,
    asValue(getEnvironmentServiceMock()),
  );

  container.register(ContainerTokens.LOGGER, asValue(getLoggerServiceMock()));

  return container;
};
