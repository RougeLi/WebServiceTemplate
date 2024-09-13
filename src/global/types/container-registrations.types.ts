import ContainerTokens from 'src/global/container-tokens';
import { DependencyResolver } from './framework.types';

/**
 * ContainerRegistration is a tuple representing the registration of a token and its resolver.
 */
type ContainerRegistration = [ContainerTokens, DependencyResolver];

/**
 * ContainerRegistrations defines an array of all container registrations.
 */
type ContainerRegistrations = ContainerRegistration[];

export default ContainerRegistrations;
