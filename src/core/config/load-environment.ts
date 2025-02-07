import dotenv from 'dotenv';
import fs from 'fs';

export function loadEnvironment(): void {
  if (!fs.existsSync('.env')) {
    console.log('.env file does not exist, skipping dotenv configuration.');
    return;
  }

  const result = dotenv.config();
  if (result.error) {
    throw result.error;
  }
  console.log('Environment variables loaded from .env file');
}
