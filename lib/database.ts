// EPV Valuation Pro - Database Connection and Utilities
import { PrismaClient } from './generated/prisma';

// Global Prisma instance for connection reuse
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create singleton Prisma client instance
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database with default data
export async function initializeDatabase() {
  try {
    // Check if system config already exists
    const configCount = await prisma.systemConfig.count();

    if (configCount === 0) {
      // Create default system configuration
      await prisma.systemConfig.createMany({
        data: [
          {
            key: 'default_currency',
            value: { currency: 'USD', symbol: '$' },
            category: 'application',
          },
          {
            key: 'analysis_defaults',
            value: {
              discountRate: 12,
              growthRate: 3,
              terminalMultiple: 2.5,
            },
            category: 'analysis',
          },
          {
            key: 'feature_flags',
            value: {
              multiUser: false,
              realTimeCollaboration: false,
              externalData: false,
            },
            category: 'features',
          },
        ],
      });

      console.log('✅ Database initialized with default configuration');
    }

    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Graceful database disconnection
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected gracefully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
  }
}

// Database transaction wrapper
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

export default prisma;
