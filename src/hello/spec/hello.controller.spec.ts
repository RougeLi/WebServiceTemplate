import { HelloController } from 'src/hello/controllers/hello.controller';
import { HelloService } from 'src/hello/services/hello.service';
import { SayHelloRequestType } from 'src/hello/types/hello.types';

describe('HelloController', () => {
  let helloController: HelloController;
  let helloService: HelloService;

  beforeEach(() => {
    helloService = {
      sayHello: jest.fn(),
    } as unknown as HelloService;

    helloController = new HelloController(helloService);
  });

  describe('sayHello', () => {
    it('should call HelloService with correct query and return the service response', () => {
      const requestMock = {
        query: {
          name: 'John',
          age: 30,
        },
      } as SayHelloRequestType;

      const serviceResponse = 'Hello John!';
      (helloService.sayHello as jest.Mock).mockReturnValue(serviceResponse);

      const result = helloController.sayHello(requestMock);

      expect(helloService.sayHello).toHaveBeenCalledWith(requestMock.query);
      expect(result).toBe(serviceResponse);
    });
  });
});
