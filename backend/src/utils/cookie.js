import { Response, Request } from 'express';
import { COOKIE_OPTIONS } from '../constants/index.js';

/**
 * Set authentication cookies
 * @param {Response} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
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
    maxAge: 60 * 60 * 1000 // 60 minutes
  });
};

/**
 * Clear authentication cookies
 * @param {Response} res - Express response object
 */
export const clearAuthCookies = (res) => {
  res.cookie('accessToken', '', {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  });

  res.cookie('refreshToken', '', {
    ...COOKIE_OPTIONS,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  });
};

/**
 * Get token from cookie
 * @param {Request} req - Express request object
 * @returns {string|null}
 */
export const getTokenFromCookie = (req) => {
  const token = req.cookies?.accessToken;
  return token ? token : null;
};
