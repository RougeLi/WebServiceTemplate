import { createContainer, AwilixContainer } from 'awilix';
import { initializeContainer, diContainer } from './di-container';

describe('DI Container', () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createContainer();
  });

  it('should initialize the container if existingContainer is provided', () => {
    const initializedContainer = initializeContainer(container);
    expect(initializedContainer).toBe(container);
    expect(diContainer).toBe(container);
  });

  it('should use the default container if existingContainer is not provided', () => {
    const initializedContainer = initializeContainer();
    expect(initializedContainer).toBe(diContainer);
  });
});
