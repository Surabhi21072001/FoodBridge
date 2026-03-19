import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'student' | 'provider' | 'admin';
  };
  token?: string;
}

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    // Also accept token as query param (used for browser-redirect OAuth flows)
    const queryToken = req.query?.token as string | undefined;

    if (!authHeader?.startsWith('Bearer ') && !queryToken) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : queryToken!;
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
        role: 'student' | 'provider' | 'admin';
      };

      req.user = decoded;
      (req as any).token = token;
      next();
    } catch (jwtError: any) {
      console.error('JWT verification failed:', jwtError.message);
      throw new UnauthorizedError('Invalid token');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to access this resource')
      );
    }

    next();
  };
};
