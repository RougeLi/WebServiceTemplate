import { AwilixContainer, createContainer, asClass } from 'awilix';
import { AppConfigType } from 'src/config/app-config.types';
import { EnvironmentService } from 'src/config/environment.service';
import ContainerTokens from 'src/global/container-tokens';
import Application from '../application';

describe('Application', () => {
  let container: AwilixContainer;
  let application: Application;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    container = createContainer();

    container.register(
      ContainerTokens.APP_CONFIG,
      asClass(EnvironmentService).singleton(),
    );

    const environmentService = container.resolve<EnvironmentService>(
      ContainerTokens.APP_CONFIG,
    );

    const appConfigType = { appName: 'TestApp' } as AppConfigType;

    jest.spyOn(environmentService, 'getConfig').mockReturnValue(appConfigType);

    application = new Application(container);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should initialize without errors', async () => {
    await expect(application.initialize()).resolves.not.toThrow();
  });

  it('should start and log the application configuration', async () => {
    await application.start();
    expect(logSpy).toHaveBeenCalledWith('Application starting...');
    expect(logSpy).toHaveBeenCalledWith(
      'Application configuration successfully loaded:',
      JSON.stringify({ appName: 'TestApp' }, undefined, 2),
    );
  });
});
