import { AppConfigType } from 'src/config/app-config.types';

export function getEnvironmentServiceMock(
  appConfigType: Partial<AppConfigType> = {},
) {
  const defaultConfig: AppConfigType = {
    ...appConfigType,
  } as AppConfigType;

  return {
    getConfig: jest.fn().mockReturnValue(defaultConfig),
  };
}
