import { Response, Request } from 'express';
import { COOKIE_OPTIONS } from '../constants/index.js';

/**
 * Set authentication cookies
 * @param {Response} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * Clear authentication cookies
 * @param {Response} res - Express response object
 */
export const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};

/**
 * Extract token from cookies
 * @param {Request} req - Express request object
 * @param {string} cookieName - Name of the cookie ('accessToken' or 'refreshToken')
 * @returns {string|null} Token value or null if not found
 */
export const getTokenFromCookie = (req: Request, cookieName: string): string | null => {
  return req.cookies[cookieName] || null;
};
