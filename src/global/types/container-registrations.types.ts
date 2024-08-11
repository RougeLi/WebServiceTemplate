import { Resolver } from 'awilix';
import ContainerTokens from 'src/global/container-tokens';

type ContainerRegistrationType = [ContainerTokens, Resolver<unknown>];

type ContainerRegistrationTypes = ContainerRegistrationType[];

export default ContainerRegistrationTypes;
