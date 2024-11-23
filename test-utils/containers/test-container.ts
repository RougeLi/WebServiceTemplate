import { asValue, AwilixContainer, createContainer } from 'awilix';
import {
  getEnvironmentServiceMock,
  getLoggerServiceMock,
} from 'test-utils/mocks';
import { ContainerTokens } from 'src/core/constants';

export const getTestContainer = (): AwilixContainer => {
  const container = createContainer({ injectionMode: 'CLASSIC' });

  container.register(
    ContainerTokens.ENVIRONMENT,
    asValue(getEnvironmentServiceMock()),
  );

  container.register(ContainerTokens.LOGGER, asValue(getLoggerServiceMock()));

  return container;
};
