import { asValue, AwilixContainer, createContainer } from 'awilix';
import ContainerTokens from 'src/global/container-tokens';
import { getEnvironmentServiceMock } from './environment.spec';
import { getLoggerServiceMock } from './logger.spec';

export const getTestContainer = (): AwilixContainer => {
  const container = createContainer({ injectionMode: 'CLASSIC' });

  container.register(
    ContainerTokens.ENVIRONMENT_SERVICE,
    asValue(getEnvironmentServiceMock()),
  );

  container.register(ContainerTokens.LOGGER, asValue(getLoggerServiceMock()));

  return container;
};
