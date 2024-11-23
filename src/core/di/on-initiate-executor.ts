import { AppContainer } from 'src/core/types';
import globalContainerConfigEntries from './global-container.config';

async function executeOnInitiateHooks(container: AppContainer): Promise<void> {
  const initTasks = globalContainerConfigEntries
    .map(({ globalContainerConfig }) => globalContainerConfig.onInitiate)
    .filter(
      (onInitiate): onInitiate is (container: AppContainer) => Promise<void> =>
        typeof onInitiate === 'function',
    );

  await Promise.all(
    initTasks.map(async (task) => {
      console.log('Executing onInitiate hook...');
      try {
        await task(container);
      } catch (e) {
        const error = e as Error;
        console.error(`Error occurred while executing onInitiate hook.
        Error: ${error.message}
        ${error.stack as string}`);
      }
    }),
  );
}

export default executeOnInitiateHooks;
