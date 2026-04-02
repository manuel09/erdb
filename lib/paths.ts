import { join, resolve } from 'node:path';

export const getRootDataDir = () => {
  if (process.env.ERDB_DATA_DIR) {
    return resolve(process.env.ERDB_DATA_DIR);
  }
  const cwd = process.cwd();
  // In Next.js standalone mode, process.cwd() is often .next/standalone
  if (cwd.includes(join('.next', 'standalone'))) {
    return join(cwd, '..', '..', 'data');
  }
  return join(cwd, 'data');
};

export const DATA_DIR = getRootDataDir();
