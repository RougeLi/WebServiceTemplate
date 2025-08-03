export * from './app-config.types';
export * from './container-registrations.types';
export * from './db-service.types';
export * from './global-container-config.types';
export * from './di.types';
export * from './module.types';
export * from './prisma.types';
export * from './logger.types';
export * from './startup-module.types';

/**
 * Recursively replaces all Date objects
 * with a string type in a given type T
 * */
export type ReplaceDateWithString<T> = T extends Date
  ? string
  : T extends Function
    ? T
    : T extends any[]
      ? number extends T['length']
        ? ReplaceDateWithString<T[number]>[]
        : { [K in keyof T]: ReplaceDateWithString<T[K]> }
      : T extends object
        ? { [K in keyof T]: ReplaceDateWithString<T[K]> }
        : T;
