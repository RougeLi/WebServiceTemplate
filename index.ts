import closeWithGrace from 'close-with-grace';
import 'reflect-metadata';
import { setupApp } from 'src/app';

(async () => {
  const app = await setupApp();
  await app.initialize();
  await app.start();

  closeWithGrace(async () => {
    console.log('APP starting shutdown.');
  });
})();
