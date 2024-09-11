import { asClass, asValue, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens } from 'src/core/constants';
import { PrismaService } from 'src/core/services';
import { InjectionTokens } from '../constants';
import { HelloModel } from '../model';

describe('HelloModel', () => {
  let container: AwilixContainer;
  let prismaService: Partial<PrismaService>;
  let helloModel: HelloModel;
  let createSpy: jest.SpyInstance;

  beforeEach(() => {
    container = getTestContainer();

    container.register(
      InjectionTokens.HELLO_MODEL,
      asClass(HelloModel).singleton(),
    );

    createSpy = jest.fn();

    prismaService = {
      user: {
        create: createSpy,
      },
    } as unknown as PrismaService;

    container.register(ContainerTokens.PRISMA, asValue(prismaService));

    helloModel = container.resolve<HelloModel>(InjectionTokens.HELLO_MODEL);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveUser', () => {
    it('should create a new user', async () => {
      await helloModel.saveUser('John', 30);
      expect(createSpy).toHaveBeenCalledWith({
        data: { Name: 'John', Age: 30 },
      });
    });
  });
});
