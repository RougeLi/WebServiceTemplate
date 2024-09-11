import { LoggerService } from 'src/global/services/logger.service';
import { HelloService } from 'src/hello/services/hello.service';
import { SayHelloQueryType } from 'src/hello/types/hello.types';

describe('HelloService', () => {
  let helloService: HelloService;
  let loggerService: LoggerService;

  beforeEach(() => {
    loggerService = {
      info: jest.fn(),
    } as unknown as LoggerService;

    helloService = new HelloService(loggerService);
  });

  describe('sayHello', () => {
    it('should return a personalized greeting when a name is provided', () => {
      const query: SayHelloQueryType = { name: 'John', age: 30 };

      const result = helloService.sayHello(query);

      expect(result).toBe('Hello John!');
      expect(loggerService.info).toHaveBeenCalledWith('Hello John!');
    });

    it('should return the default greeting when no name is provided', () => {
      const query: SayHelloQueryType = { name: undefined, age: 30 };

      const result = helloService.sayHello(query);

      expect(result).toBe('Hello guys!');
      expect(loggerService.info).toHaveBeenCalledWith('Hello guys!');
    });

    it('should return the default greeting when an empty name is provided', () => {
      const query: SayHelloQueryType = { name: '', age: 30 };

      const result = helloService.sayHello(query);

      expect(result).toBe('Hello guys!');
      expect(loggerService.info).toHaveBeenCalledWith('Hello guys!');
    });
  });
});
