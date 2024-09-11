import { AwilixContainer } from 'awilix';
import { AppConfigType } from 'src/config/app-config.types';
import { EnvironmentService } from 'src/config/environment.service';
import ContainerTokens from 'src/global/container-tokens';
import { getTestContainer } from 'tests/container.mock';
import Application from '../application';

jest.mock('src/server/web-server');

const mockWebInstance = {
  listen: jest.fn(),
};

describe('Application', () => {
  let container: AwilixContainer;
  let environmentService: Partial<EnvironmentService>;
  let application: Application;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    container = getTestContainer();

    environmentService = container.resolve<EnvironmentService>(
      ContainerTokens.ENVIRONMENT_SERVICE,
    );

    jest.spyOn(environmentService, 'getConfig').mockReturnValue({
      appName: 'TestApp',
      appPort: 3000,
    } as AppConfigType);

    const createWeb = require('src/server/web-server').default;
    createWeb.mockReturnValue(mockWebInstance);

    application = new Application(container);
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should initialize without errors', async () => {
    await expect(application.initialize()).resolves.not.toThrow();
    expect(logSpy).toHaveBeenCalledWith('Application initialization started');
    expect(logSpy).toHaveBeenCalledWith(
      'Application configuration successfully loaded:',
      JSON.stringify({ appName: 'TestApp', appPort: 3000 }, undefined, 2),
    );
  });

  it('should start and log the application configuration', async () => {
    await application.initialize();
    await application.start();
    expect(logSpy).toHaveBeenCalledWith('Application starting...');
    expect(mockWebInstance.listen).toHaveBeenCalledWith({
      host: '::',
      port: 3000,
    });
  });
});
