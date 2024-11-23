import globalContainerConfigTuples from 'src/core/di/global-container.config';
import { ContainerRegistrations } from 'src/core/types';
import { makeContainerRegistration } from 'src/core/utils';

const globalContainers: ContainerRegistrations =
  globalContainerConfigTuples.map(
    ({ containerTokens, globalContainerConfig }) =>
      makeContainerRegistration(
        containerTokens,
        globalContainerConfig.service,
        globalContainerConfig.mode,
      ),
  );

export default globalContainers;
