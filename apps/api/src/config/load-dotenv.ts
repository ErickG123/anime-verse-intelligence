import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads environment variables from workspace root `.env` (and optional `apps/api/.env`)
 * without overriding variables already provided in `process.env`.
 */
export function loadWorkspaceDotenv(): string[] {
  const candidates = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../../.env'),
  ];
  const loaded: string[] = [];

  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
      loaded.push(envPath);
    }
  }
  return loaded;
}

loadWorkspaceDotenv();
