import { Environment } from 'src/core/constants';
import EnvironmentService from '../environment.service';

describe('EnvironmentService', () => {
  let environmentService: EnvironmentService;

  beforeAll(() => {
    process.env.APP_NAME = 'TestApp';
    process.env.APP_ENV = 'development';
    environmentService = new EnvironmentService();
  });

  afterAll(() => {
    delete process.env.APP_NAME;
    delete process.env.APP_ENV;
  });

  it('should return the correct appName from the environment variable', () => {
    const config = environmentService.getConfig();
    expect(config.appName).toBe('TestApp');
  });

  it('should return the correct appEnv from the environment variable', () => {
    const appEnv = environmentService.getAppEnv();
    expect(appEnv).toBe(Environment.DEVELOPMENT);
  });

  it('should return true if the environment is development', () => {
    const isDev = environmentService.isDevelopment();
    expect(isDev).toBe(true);
  });

  it('should return false if the environment is not development', () => {
    process.env.APP_ENV = 'production';
    environmentService = new EnvironmentService();
    const isDev = environmentService.isDevelopment();
    expect(isDev).toBe(false);
  });
});
