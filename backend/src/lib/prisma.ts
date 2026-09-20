import { PrismaClient } from '@prisma/client';

// Prisma's Rust query engine uses Tokio. Set a conservative worker count before
// the engine is loaded so a constrained LiteSpeed account does not allocate one
// worker per reported CPU. The hosting environment may override this value.
process.env.PRISMA_CLIENT_ENGINE_TYPE ||= 'library';
process.env.TOKIO_WORKER_THREADS ||= process.env.PRISMA_TOKIO_WORKER_THREADS || '2';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

global.prisma = prisma;
