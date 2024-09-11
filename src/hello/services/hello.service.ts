import { LoggerService } from 'src/global/services/logger.service';
import { SayHelloQueryType } from 'src/hello/types/hello.types';

export class HelloService {
  constructor(private readonly logger: LoggerService) {}

  sayHello(query: SayHelloQueryType): string {
    const message = query.name ? `Hello ${query.name}!` : 'Hello guys!';
    this.logger.info(message);
    return message;
  }
}
