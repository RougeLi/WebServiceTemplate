import { asValue, AwilixContainer, createContainer } from 'awilix';
import ContainerTokens from 'src/global/container-tokens';
import { getEnvironmentServiceMock } from './environment.mock';

export const getTestContainer = (): AwilixContainer => {
  const container = createContainer();

  container.register(
    ContainerTokens.APP_CONFIG,
    asValue(getEnvironmentServiceMock()),
  );

  return container;
};
