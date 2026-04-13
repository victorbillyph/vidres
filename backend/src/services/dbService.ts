import fs from 'fs/promises';
import path from 'path';
import { config, uploadPaths } from '../config';
import type { DatabaseSchema } from '../types';

const initialCollections: DatabaseSchema = {
  users: [],
  channels: [],
  videos: [],
  comments: [],
  reports: [],
};

let initialized = false;
let queue: Promise<unknown> = Promise.resolve();

function getCollectionPath(collection: keyof DatabaseSchema): string {
  return path.join(config.dataDir, `${collection}.json`);
}

async function ensureCollectionFile(collection: keyof DatabaseSchema): Promise<void> {
  const collectionPath = getCollectionPath(collection);

  try {
    await fs.access(collectionPath);
  } catch {
    await fs.writeFile(collectionPath, JSON.stringify(initialCollections[collection], null, 2), 'utf-8');
  }
}

export async function ensureStorage(): Promise<void> {
  if (initialized) {
    return;
  }

  await fs.mkdir(config.dataDir, { recursive: true });
  await fs.mkdir(uploadPaths.raw, { recursive: true });
  await fs.mkdir(uploadPaths.videos, { recursive: true });
  await fs.mkdir(uploadPaths.thumbnails, { recursive: true });
  await fs.mkdir(uploadPaths.channels, { recursive: true });

  await Promise.all(
    (Object.keys(initialCollections) as Array<keyof DatabaseSchema>).map((collection) =>
      ensureCollectionFile(collection),
    ),
  );

  initialized = true;
}

export async function readCollection<K extends keyof DatabaseSchema>(
  collection: K,
): Promise<DatabaseSchema[K]> {
  await ensureStorage();
  const raw = await fs.readFile(getCollectionPath(collection), 'utf-8');

  if (!raw.trim()) {
    return JSON.parse(JSON.stringify(initialCollections[collection])) as DatabaseSchema[K];
  }

  return JSON.parse(raw) as DatabaseSchema[K];
}

export async function writeCollection<K extends keyof DatabaseSchema>(
  collection: K,
  data: DatabaseSchema[K],
): Promise<void> {
  await ensureStorage();
  await fs.writeFile(getCollectionPath(collection), JSON.stringify(data, null, 2), 'utf-8');
}

export async function withDatabaseLock<T>(operation: () => Promise<T>): Promise<T> {
  await ensureStorage();
  const nextRun = queue.then(operation, operation);
  queue = nextRun.then(() => undefined, () => undefined);
  return nextRun;
}

export async function readDatabase(): Promise<DatabaseSchema> {
  const [users, channels, videos, comments, reports] = await Promise.all([
    readCollection('users'),
    readCollection('channels'),
    readCollection('videos'),
    readCollection('comments'),
    readCollection('reports'),
  ]);

  return { users, channels, videos, comments, reports };
}
