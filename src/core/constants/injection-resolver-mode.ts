/**
 * InjectionResolverMode specifies various modes for resolving dependencies in the DI container.
 * - SINGLETON: Shares the same instance across the entire application lifecycle.
 * - SCOPED: Creates a new instance for each request or scope, commonly used in web requests.
 * - TRANSIENT: Instantiates a new instance every time the dependency is requested.
 * - PROXY: Lazily creates instances when accessed, useful for testing or delayed instantiation.
 * - CLASSIC: Provides a flexible instantiation method, allowing for traditional object creation patterns.
 */
export enum InjectionResolverMode {
  SINGLETON = 'singleton',
  SCOPED = 'scoped',
  TRANSIENT = 'transient',
  PROXY = 'proxy',
  CLASSIC = 'classic',
}
