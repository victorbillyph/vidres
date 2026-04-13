import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import type { AuthorProfile, JwtPayload, SessionUser, User } from '../types';
import { readCollection, withDatabaseLock, writeCollection } from './dbService';
import { generateId } from '../utils/id';
import { HttpError } from '../utils/http';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    channelId: user.channelId,
    createdAt: user.createdAt,
  };
}

export function toAuthorProfile(user: User): AuthorProfile {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    profileImage: user.profileImage,
    channelId: user.channelId,
  };
}

export async function isSetupRequired(): Promise<boolean> {
  const users = await readCollection('users');
  return users.length === 0;
}

async function createUserRecord(input: {
  name: string;
  email: string;
  password: string;
  role: User['role'];
}): Promise<User> {
  return withDatabaseLock(async () => {
    const users = await readCollection('users');
    const email = normalizeEmail(input.email);

    if (users.some((user) => normalizeEmail(user.email) === email)) {
      throw new HttpError(409, 'Email already registered.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const now = new Date().toISOString();

    const newUser: User = {
      id: generateId('usr'),
      name: input.name.trim(),
      email,
      passwordHash,
      role: input.role,
      createdAt: now,
    };

    users.push(newUser);
    await writeCollection('users', users);
    return newUser;
  });
}

export async function createSuperadmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  if (!(await isSetupRequired())) {
    throw new HttpError(400, 'Initial setup has already been completed.');
  }

  return createUserRecord({ ...input, role: 'superadmin' });
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  if (await isSetupRequired()) {
    throw new HttpError(403, 'Finish the first setup before registering users.');
  }

  return createUserRecord({ ...input, role: 'user' });
}

export async function loginUser(email: string, password: string): Promise<User> {
  const users = await readCollection('users');
  const user = users.find((item) => normalizeEmail(item.email) === normalizeEmail(email));

  if (!user) {
    throw new HttpError(401, 'Invalid credentials.');
  }

  const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordIsValid) {
    throw new HttpError(401, 'Invalid credentials.');
  }

  return user;
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const users = await readCollection('users');
  return users.find((user) => user.id === userId);
}

export function signToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
