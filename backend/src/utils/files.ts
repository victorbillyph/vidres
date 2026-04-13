import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export function toPublicPath(absolutePath: string): string {
  return `/${path.relative(config.rootDir, absolutePath).replace(/\\/g, '/')}`;
}

export function toAbsolutePath(publicPath: string): string {
  const cleanPath = publicPath.replace(/^\/+/, '');
  return path.join(config.rootDir, cleanPath);
}

export async function moveUploadedFile(sourcePath: string, targetPath: string): Promise<string> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.rename(sourcePath, targetPath);
  return toPublicPath(targetPath);
}

export async function safeDeletePublicFile(publicPath?: string): Promise<void> {
  if (!publicPath) {
    return;
  }

  try {
    await fs.unlink(toAbsolutePath(publicPath));
  } catch {
    // Ignore missing files during cleanup.
  }
}
