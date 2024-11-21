import { AppConfigType } from 'src/core/types';

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
