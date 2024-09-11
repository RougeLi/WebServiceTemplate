import { IModule } from 'src/core/types';
import { HelloModule } from 'src/modules/hello';

const modules: IModule[] = [new HelloModule()];

export default modules;
