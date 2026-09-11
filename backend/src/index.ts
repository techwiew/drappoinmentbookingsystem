import { createApp } from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

export const app = createApp();

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
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
}

export default app;

