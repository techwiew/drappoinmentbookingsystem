const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  databaseUrl: requiredEnv("DATABASE_URL"),
  jwt: {
    secret: requiredEnv("JWT_SECRET"),
    expiresIn: "15m",
    refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),
    refreshExpiresIn: "7d",
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};