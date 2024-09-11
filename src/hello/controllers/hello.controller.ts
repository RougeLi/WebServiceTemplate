import { HelloService } from 'src/hello/services/hello.service';
import { SayHelloRequestType } from 'src/hello/types/hello.types';

export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  sayHello(request: SayHelloRequestType) {
    const { query } = request;
    return this.helloService.sayHello(query);
  }
}
