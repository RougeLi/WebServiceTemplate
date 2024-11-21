import { ContainerTokens } from 'src/core/constants';
import { DependencyResolver } from './di.types';

/**
 * ContainerRegistration is a tuple representing the registration of a token and its resolver.
 */
export type ContainerRegistration = [ContainerTokens, DependencyResolver];

/**
 * ContainerRegistrations defines an array of all container registrations.
 */
export type ContainerRegistrations = ContainerRegistration[];
