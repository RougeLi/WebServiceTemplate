import closeWithGrace from 'close-with-grace';
import 'reflect-metadata';
import { setupApp } from 'src/core/app';
import { globalDIConfigs } from 'src/core/di';
import modules from 'src/modules';

(async () => {
  const app = await setupApp(globalDIConfigs, modules);
  await app.initialize();
  await app.start();

  closeWithGrace(async () => {
    console.log('APP starting shutdown.');
  });
})();
