import { Environment } from 'src/core/constants';
import { AppConfigType } from 'src/core/types';

export function getEnvironmentServiceMock(
  appConfigType: Partial<AppConfigType> = {
    appEnv: Environment.DEVELOPMENT,
  },
  databaseUrl?: string,
) {
  const defaultConfig: AppConfigType = {
    ...appConfigType,
  } as AppConfigType;

  return {
    getDatabaseUrl: jest.fn().mockReturnValue(databaseUrl),
    getConfig: jest.fn().mockReturnValue(defaultConfig),
    getAppEnv: jest.fn().mockReturnValue(defaultConfig.appEnv),
    isDevelopment: jest
      .fn()
      .mockReturnValue(defaultConfig.appEnv === Environment.DEVELOPMENT),
  };
}
