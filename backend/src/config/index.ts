import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'clinicflow_super_secret_jwt_access_token_key_2026',
    expiresIn: '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'clinicflow_super_secret_jwt_refresh_token_key_2026',
    refreshExpiresIn: '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
