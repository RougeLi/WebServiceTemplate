import dotenv from 'dotenv';

export function loadEnvironment(): void {
  if (process.env.IS_DOCKER) {
    console.log('Running inside Docker, skipping .env loading');
    return;
  }

  const result: dotenv.DotenvConfigOutput = dotenv.config();

  if (result.error) {
    throw result.error;
  }

  console.log('Environment variables loaded from .env file');
}
