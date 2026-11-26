import { AppContainer, GlobalContainerConfigEntries } from 'src/core/types';

function describeRejection(value: unknown): string {
  try {
    return value instanceof Error
      ? `${value.message}\n        ${value.stack ?? ''}`
      : String(value);
  } catch {
    // Even checking the type can throw for a revoked proxy.
    return '[unprintable rejection]';
  }
}

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
        // Hooks may reject with any value (even undefined); logging must not
        // throw, or the remaining hooks would no longer be awaited.
        const details = describeRejection(e);
        console.error(`Error occurred while executing ${required ? 'required ' : ''}onInitiate hook.
        Error: ${details}`);
        if (required) {
          requiredErrors.push(e);
        }
      }
    }),
  );

  if (requiredErrors.length > 0) {
    // Rethrow the original value unchanged, whatever its type.
    throw requiredErrors[0];
  }
}

export default executeOnInitiateHooks;
