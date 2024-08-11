import dotenv from 'dotenv';

export function loadEnvironment(): void {
  const result: dotenv.DotenvConfigOutput = dotenv.config();

  if (result.error) {
    throw result.error;
  }
}
