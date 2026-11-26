import { AppContainer, GlobalContainerConfigEntries } from 'src/core/types';

type InitTask = {
  onInitiate: (container: AppContainer) => Promise<void>;
  required: boolean;
};

/**
 * Runs every global `onInitiate` hook concurrently and waits for all of them.
 * A failing hook is logged; if it is marked `required`, the first such
 * original error (in the order the failures occur) is rethrown after all
 * hooks have settled. Failures of other hooks never reject.
 */
async function executeOnInitiateHooks(
  container: AppContainer,
  globalContainerConfigEntries: GlobalContainerConfigEntries,
): Promise<void> {
  const initTasks: InitTask[] = [];
  for (const { globalContainerConfig } of globalContainerConfigEntries) {
    const { onInitiate, required } = globalContainerConfig;
    if (typeof onInitiate === 'function') {
      initTasks.push({ onInitiate, required: required === true });
    }
  }

  const requiredErrors: unknown[] = [];
  await Promise.all(
    initTasks.map(async ({ onInitiate, required }) => {
      console.log('Executing onInitiate hook...');
      try {
        await onInitiate(container);
      } catch (e) {
        const error = e as Error;
        console.error(`Error occurred while executing ${required ? 'required ' : ''}onInitiate hook.
        Error: ${error.message}
        ${error.stack as string}`);
        if (required) {
          requiredErrors.push(e);
        }
      }
    }),
  );

  if (requiredErrors.length > 0) {
    throw requiredErrors[0];
  }
}

export default executeOnInitiateHooks;
