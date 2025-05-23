import closeWithGrace from 'close-with-grace';
import 'reflect-metadata';
import { WebServerModule } from 'src/core';
import { setupApp } from 'src/core/app';
import { globalDIConfigs } from 'src/core/di';
import modules from 'src/modules';

(async () => {
  // Create and configure the application instance
  const app = await setupApp(globalDIConfigs, modules);

  // Register the web server module to handle HTTP requests
  app.registerStartupModule(new WebServerModule());

  // Initialize the application and all registered modules
  await app.initialize();

  // Start the application and begin accepting requests
  await app.start();

  // Handle a graceful shutdown
  closeWithGrace(async ({ signal, err }) => {
    console.log(
      `APP starting shutdown. Signal: ${signal}${err ? `, Error: ${err.message}` : ''}`,
    );

    // Stop the application and all its modules
    await app.stop();

    console.log('APP shutdown completed.');
    process.exit(0);
  });
})();
