import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma, connectWithRetry } from './lib/prisma.js';

export const app = createApp();

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  // Connect to database with retry logic before starting the server
  connectWithRetry()
    .then(() => {
      const server = app.listen(config.port, () => {
        console.log(
          `\n🏥 MediNovel API Server running at http://localhost:${config.port}`,
        );
        console.log(`📡 Health endpoint: http://localhost:${config.port}/api/health`);
        console.log(`🌍 Environment: ${config.env}\n`);
      });

      const shutdown = async (signal: string) => {
        console.log(`\n🛑 Received ${signal}, closing server...`);
        server.close(async () => {
          await prisma.$disconnect();
          console.log('✅ Server and Database connections closed cleanly');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((error) => {
      console.error('❌ Failed to start server due to database connection error');
      process.exit(1);
    });
}

export default app;