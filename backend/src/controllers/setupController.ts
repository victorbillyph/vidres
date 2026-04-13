import type { Response } from 'express';
import { config } from '../config';
import { createSuperadmin, isSetupRequired, signToken, toSessionUser } from '../services/authService';
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

export async function getSetupStatus(_req: AuthenticatedRequest, res: Response) {
  res.json({ needsSetup: await isSetupRequired() });
}

export async function completeSetup(req: AuthenticatedRequest, res: Response) {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    throw new HttpError(400, 'Name, email and password are required.');
  }

  const user = await createSuperadmin({ name, email, password });
  const token = signToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    message: 'Superadmin created successfully.',
    user: toSessionUser(user),
  });
}
