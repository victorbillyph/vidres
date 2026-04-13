import path from 'path';
import type { Channel, User } from '../types';
import { readCollection, withDatabaseLock, writeCollection } from './dbService';
import { generateId } from '../utils/id';
import { HttpError } from '../utils/http';
import { moveUploadedFile, safeDeletePublicFile } from '../utils/files';
import { uploadPaths } from '../config';

export async function saveChannelImage(file: Express.Multer.File | undefined): Promise<string | undefined> {
  if (!file) {
    return undefined;
  }

  const extension = path.extname(file.originalname || file.filename) || '.png';
  const targetPath = path.join(uploadPaths.channels, `${Date.now()}-${generateId('channel')}${extension}`);
  return moveUploadedFile(file.path, targetPath);
}

export async function getChannelById(channelId: string): Promise<Channel | undefined> {
  const channels = await readCollection('channels');
  return channels.find((channel) => channel.id === channelId);
}

export async function getChannelByUserId(userId: string): Promise<Channel | undefined> {
  const channels = await readCollection('channels');
  return channels.find((channel) => channel.userId === userId);
}

export async function createChannelForUser(
  user: User,
  input: { name: string; description: string; imageUrl?: string },
): Promise<Channel> {
  return withDatabaseLock(async () => {
    const users = await readCollection('users');
    const channels = await readCollection('channels');

    const currentUser = users.find((item) => item.id === user.id);
    if (!currentUser) {
      throw new HttpError(404, 'User not found.');
    }

    if (currentUser.channelId) {
      throw new HttpError(409, 'This user already has a channel.');
    }

    const now = new Date().toISOString();
    const newChannel: Channel = {
      id: generateId('chn'),
      userId: user.id,
      name: input.name.trim(),
      description: input.description.trim(),
      imageUrl: input.imageUrl,
      createdAt: now,
      updatedAt: now,
    };

    channels.push(newChannel);
    currentUser.channelId = newChannel.id;

    await writeCollection('channels', channels);
    await writeCollection('users', users);
    return newChannel;
  });
}

export async function updateUserChannel(
  user: User,
  input: { name: string; description: string; imageUrl?: string },
): Promise<Channel> {
  return withDatabaseLock(async () => {
    const channels = await readCollection('channels');
    const channel = channels.find((item) => item.userId === user.id);

    if (!channel) {
      throw new HttpError(404, 'Channel not found for this user.');
    }

    if (input.imageUrl && channel.imageUrl && channel.imageUrl !== input.imageUrl) {
      await safeDeletePublicFile(channel.imageUrl);
    }

    channel.name = input.name.trim();
    channel.description = input.description.trim();
    channel.imageUrl = input.imageUrl ?? channel.imageUrl;
    channel.updatedAt = new Date().toISOString();

    await writeCollection('channels', channels);
    return channel;
  });
}
