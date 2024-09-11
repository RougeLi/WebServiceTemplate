import { asClass, asValue, AwilixContainer } from 'awilix';
import { getTestContainer } from 'test-utils/containers';
import { ContainerTokens } from 'src/core/constants';
import { LoggerService } from 'src/core/services';
import { InjectionTokens } from '../constants/injection-tokens';
import { HelloModel } from '../model';
import { HelloService } from '../services';

type SayHelloQueryType = {
  name?: string;
  age?: number;
};

describe('HelloService', () => {
  let container: AwilixContainer;
  let logger: LoggerService;
  let helloModel: HelloModel;
  let helloService: HelloService;
  let infoSpy: jest.SpyInstance;

  beforeEach(() => {
    container = getTestContainer();

    container.register(
      InjectionTokens.HELLO_SERVICE,
      asClass(HelloService).singleton(),
    );

    container.register(
      InjectionTokens.HELLO_MODEL,
      asValue({
        saveUser: jest.fn(),
      }),
    );

    logger = container.resolve<LoggerService>(ContainerTokens.LOGGER);
    helloModel = container.resolve<HelloModel>(InjectionTokens.HELLO_MODEL);

    helloService = container.resolve<HelloService>(
      InjectionTokens.HELLO_SERVICE,
    );

    infoSpy = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sayHello', () => {
    it('should return a personalized greeting when a name is provided', async () => {
      const query: SayHelloQueryType = { name: 'John', age: 30 };
      const result = await helloService.sayHello(query);
      expect(result).toBe('Hello John!');
      expect(infoSpy).toHaveBeenCalledWith('Saying hello to John...');
      expect(helloModel.saveUser).toHaveBeenCalledWith('John', 30);
    });

    it('should return the default greeting when no name is provided', async () => {
      const query: SayHelloQueryType = { name: undefined, age: 30 };
      const result = await helloService.sayHello(query);
      expect(result).toBe('Hello guys!');
      expect(infoSpy).toHaveBeenCalledWith('Saying hello to guys...');
      expect(helloModel.saveUser).toHaveBeenCalledWith('guys', 30);
    });

    it('should age 18 as the default age when no age is provided', async () => {
      const query: SayHelloQueryType = { name: 'John', age: undefined };
      const result = await helloService.sayHello(query);
      expect(result).toBe('Hello John!');
      expect(infoSpy).toHaveBeenCalledWith('Saying hello to John...');
      expect(helloModel.saveUser).toHaveBeenCalledWith('John', 18);
    });

    it('should return a personalized greeting when a name is provided and the age is less than 18', async () => {
      const query: SayHelloQueryType = { name: 'John', age: 15 };
      const result = await helloService.sayHello(query);
      expect(result).toBe('Hello John! You are still young.');
      expect(infoSpy).toHaveBeenCalledWith('Saying hello to John...');
      expect(helloModel.saveUser).toHaveBeenCalledWith('John', 15);
    });
  });
});
