import { IModule } from 'src/global/types/module.types';
import { HelloModule } from 'src/hello/hello.module';

const modules: IModule[] = [new HelloModule()];

export default modules;
