import { PrismaClient } from '@prisma/client';

// Prisma's Rust query engine uses Tokio. Set a conservative worker count before
// the engine is loaded so a constrained LiteSpeed account does not allocate one
// worker per reported CPU. The hosting environment may override this value.
process.env.PRISMA_CLIENT_ENGINE_TYPE ||= 'library';
process.env.TOKIO_WORKER_THREADS ||= process.env.PRISMA_TOKIO_WORKER_THREADS || '2';

/**
 * Append query parameters to a database URL
 */
function appendQueryParams(url: string, params: Record<string, string | number>): string {
  const [base, existingQuery = ''] = url.split('?');
  const existingParams = new URLSearchParams(existingQuery);
  Object.entries(params).forEach(([key, value]) => {
    existingParams.set(key, String(value));
  });
  const newQuery = existingParams.toString();
  return newQuery ? `${base}?${newQuery}` : base;
}

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL || "";
// Add connection limit and timeout parameters
const connectionOptions = {
  connectionLimit: 10, // Max number of connections in the pool
  connectTimeout: 10000, // Connection timeout in milliseconds (10s)
};
const formattedUrl = appendQueryParams(databaseUrl, connectionOptions);

// Prisma client instance
const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: formattedUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Export the prisma client for use throughout the application
export const prisma = global.prisma || prismaClient;

// Keep the global instance updated for hot-reload in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prismaClient;
}

/**
 * Attempt to connect to the database with exponential backoff retry
 * @param maxRetries Maximum number of retry attempts
 * @param baseDelay Base delay in milliseconds for exponential backoff
 * @returns Promise that resolves when connected or retries exhausted
 */
export async function connectWithRetry(
  maxRetries = 5,
  baseDelay = 1000
): Promise<void> {
  let retries = 0;
  while (true) {
    try {
      await prismaClient.$connect();
      console.log('🔌 Database connection established successfully');
      return;
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        console.error('❌ Failed to connect to database after', maxRetries, 'attempts');
        console.error('Error:', error);
        throw error;
      }
      const delay = baseDelay * 2 ** (retries - 1); // Exponential backoff
      console.warn(
        `⚠️ Database connection attempt ${retries} failed. Retrying in ${delay}ms...`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}