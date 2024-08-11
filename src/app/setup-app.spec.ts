import { asValue } from 'awilix';
import Application from './application';
import setupApp from './setup-app';

jest.mock('src/modules', () => ({
  __esModule: true,
  default: [
    {
      registerDependencies: jest
        .fn()
        .mockReturnValue([
          { name: 'testDependency', registration: asValue('testValue') },
        ]),
      registerRoutes: jest.fn(),
    },
  ],
}));

describe('setupApp', () => {
  it('should setup the application and return an instance', async () => {
    const app = await setupApp();
    expect(app).toBeInstanceOf(Application);
  });
});
