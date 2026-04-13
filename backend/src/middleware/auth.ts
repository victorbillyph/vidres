import type { NextFunction, Request, Response } from 'express';
import type { User } from '../types';
import { config } from '../config';
import { findUserById, verifyToken } from '../services/authService';
import { HttpError } from '../utils/http';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

function getTokenFromRequest(req: Request): string | undefined {
  const cookieToken = req.cookies?.[config.tokenName] as string | undefined;
  const authorization = req.headers.authorization;

  if (authorization?.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '').trim();
  }

  return cookieToken;
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      next();
      return;
    }

    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    next();
  }
}

export async function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new HttpError(401, 'Authentication required.');
    }

    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);

    if (!user) {
      throw new HttpError(401, 'User session is invalid.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: User['role'][]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required.'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'You do not have access to this area.'));
      return;
    }

    next();
  };
}
