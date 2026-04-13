import type { Response } from 'express';
import { config } from '../config';
import { loginUser, registerUser, signToken, toSessionUser } from '../services/authService';
import type { AuthenticatedRequest } from '../middleware/auth';
import { HttpError } from '../utils/http';

function setAuthCookie(res: Response, token: string): void {
  res.cookie(config.tokenName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: config.tokenMaxAgeMs,
  });
}

export async function register(req: AuthenticatedRequest, res: Response) {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    throw new HttpError(400, 'Name, email and password are required.');
  }

  const user = await registerUser({ name, email, password });
  const token = signToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    message: 'Account created successfully.',
    user: toSessionUser(user),
  });
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const user = await loginUser(email, password);
  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    message: 'Login completed successfully.',
    user: toSessionUser(user),
  });
}

export async function logout(_req: AuthenticatedRequest, res: Response) {
  res.clearCookie(config.tokenName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.json({ message: 'Session closed successfully.' });
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required.');
  }

  res.json({ user: toSessionUser(req.user) });
}
