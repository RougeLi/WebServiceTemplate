import { asClass, asValue, AwilixContainer } from 'awilix';
import { FastifyRequest } from 'fastify';
import { getTestContainer } from 'test-utils/containers';
import { InjectionTokens } from '../constants';
import { HelloController } from '../controllers';
import { HelloService } from '../services';

type SayHelloRequestType = FastifyRequest & {
  query: {
    name?: string;
    age?: number;
  };
};

describe('HelloController', () => {
  let container: AwilixContainer;
  let helloService: Partial<HelloService>;
  let helloController: HelloController;

  beforeEach(() => {
    container = getTestContainer();

    container.register(
      InjectionTokens.HELLO_CONTROLLER,
      asClass(HelloController).singleton(),
    );

    helloService = {
      sayHello: jest.fn(),
    } as unknown as HelloService;

    container.register(InjectionTokens.HELLO_SERVICE, asValue(helloService));

    helloController = container.resolve<HelloController>(
      InjectionTokens.HELLO_CONTROLLER,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sayHello', () => {
    it('should call HelloService with correct query and return the service response', async () => {
      const requestMock = {
        query: {
          name: 'John',
          age: 30,
        },
      } as SayHelloRequestType;

      const serviceResponse = 'Hello John!';
      (helloService.sayHello as jest.Mock).mockReturnValue(serviceResponse);

      const result = await helloController.sayHello(requestMock);

      expect(helloService.sayHello).toHaveBeenCalledWith(requestMock.query);
      expect(result).toBe(serviceResponse);
    });
  });
});
