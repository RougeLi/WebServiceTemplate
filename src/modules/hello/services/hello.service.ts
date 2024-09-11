import { LoggerService } from 'src/core/services';
import { HelloModel } from '../model';
import { SayHelloParameter } from '../types';

export default class HelloService {
  constructor(
    private readonly logger: LoggerService,
    private readonly helloModel: HelloModel,
  ) {}

  async sayHello(sayHelloParameter: SayHelloParameter): Promise<string> {
    const { name, age } = sayHelloParameter;
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
