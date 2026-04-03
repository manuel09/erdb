
import Database from 'better-sqlite3';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';

const resolveDbDir = () => {
  if (process.env.ERDB_DATA_DIR) {
    return path.resolve(process.env.ERDB_DATA_DIR);
  }

  if (process.env.NODE_ENV === 'production') {
    return path.resolve('/app/data');
  }

  return path.resolve(process.cwd(), 'data');
};

const DB_DIR = resolveDbDir();
const DB_PATH = path.join(DB_DIR, 'accounts.db');

// Ensure the data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

export const accountsDb = new Database(DB_PATH);

// Initialize the tokens table
accountsDb.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    config_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_tokens_updated_at ON tokens(updated_at);
`);

// Optimize database performance
accountsDb.pragma('journal_mode = WAL');
accountsDb.pragma('synchronous = NORMAL');
