import { EnvironmentService } from './environment.service';

describe('EnvironmentService', () => {
  let environmentService: EnvironmentService;

  beforeAll(() => {
    process.env.APP_NAME = 'TestApp';
    environmentService = new EnvironmentService();
  });

  afterAll(() => {
    delete process.env.APP_NAME;
  });

  it('should return the correct appName from the environment variable', () => {
    const config = environmentService.getConfig();
    expect(config.appName).toBe('TestApp');
  });

  it('should return the default appName when the environment variable is not set', () => {
    delete process.env.APP_NAME;
    environmentService = new EnvironmentService();
    const config = environmentService.getConfig();
    expect(config.appName).toBe('ServiceTemplate');
  });
});
