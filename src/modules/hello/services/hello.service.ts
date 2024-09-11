import { LoggerService } from 'src/core/services';
import { HelloModel } from '../model/hello.model';
import { SayHelloQueryType } from '../types/hello.types';

export class HelloService {
  constructor(
    private readonly logger: LoggerService,
    private readonly helloModel: HelloModel,
  ) {}

  async sayHello(query: SayHelloQueryType): Promise<string> {
    const { name, age } = query;
    const Name = name ? name : 'guys';
    const Age = age ? age : 18;
    this.logger.info(`Saying hello to ${Name}...`);
    await this.helloModel.saveUser(Name, Age);

    if (Age < 18) {
      return `Hello ${Name}! You are still young.`;
    }
    return `Hello ${Name}!`;
  }
}
