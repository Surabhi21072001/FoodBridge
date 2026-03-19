/**
 * Chat Rate Limiting Middleware
 * Implements per-user rate limiting for chat endpoint
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [userId: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const CHAT_RATE_LIMIT_REQUESTS = parseInt(process.env.CHAT_RATE_LIMIT_REQUESTS || "20");
const CHAT_RATE_LIMIT_WINDOW_MS = parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS || "60000");

export const chatRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const now = Date.now();
  const userLimit = store[userId];

  // Initialize or reset if window expired
  if (!userLimit || now > userLimit.resetTime) {
    store[userId] = {
      count: 1,
      resetTime: now + CHAT_RATE_LIMIT_WINDOW_MS,
    };
    next();
    return;
  }

  // Check if limit exceeded
  if (userLimit.count >= CHAT_RATE_LIMIT_REQUESTS) {
    const resetIn = Math.ceil((userLimit.resetTime - now) / 1000);
    res.status(429).json({
      success: false,
      message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
      retryAfter: resetIn,
    });
    return;
  }

  // Increment counter
  userLimit.count++;
  next();
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const userId in store) {
    if (now > store[userId].resetTime) {
      delete store[userId];
    }
  }
}, 5 * 60 * 1000);
