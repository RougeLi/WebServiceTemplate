import { createContainer, AwilixContainer } from 'awilix';

let diContainer: AwilixContainer = createContainer();

function initializeContainer(
  existingContainer?: AwilixContainer,
): AwilixContainer {
  if (existingContainer) {
    diContainer = existingContainer;
  }

  return diContainer;
}

export { initializeContainer, diContainer };
