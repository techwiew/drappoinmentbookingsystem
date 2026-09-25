import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Helper to get IP address, considering proxies
const getIP = (req: Request): string => {
  return req.headers['x-forwarded-for'] as string || 
         req.connection.remoteAddress || 
         req.socket?.remoteAddress ||
         req.ip ||
         '';
};

// Rate limiter for auth endpoints (strict)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again after 15 minutes',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  keyGenerator: (req) => getIP(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many authentication attempts, please try again after 15 minutes',
      },
    });
  },
});

// Rate limiter for OTP endpoints (even stricter)
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many OTP requests, please try again after 15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getIP(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many OTP requests, please try again after 15 minutes',
      },
    });
  },
});

// General API rate limiter (moderate)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again after 15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getIP(req),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again after 15 minutes',
      },
    });
  },
});

// Rate limiter for authenticated users (more lenient)
export const authenticatedUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each authenticated user to 500 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this account, please try again after 15 minutes',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if available, otherwise fall back to IP
    const userId = (req as any).user?.userId;
    if (userId) return `user:${userId}`;
    return getIP(req);
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this account, please try again after 15 minutes',
      },
    });
  },
});

export default {
  authLimiter,
  otpLimiter,
  apiLimiter,
  authenticatedUserLimiter,
};
