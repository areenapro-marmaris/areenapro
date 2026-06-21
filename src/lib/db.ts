import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (typeof window === 'undefined') {
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    try {
      const pool = new pg.Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      
      if (process.env.NODE_ENV === 'production') {
        prismaInstance = new PrismaClient({ adapter });
      } else {
        if (!globalForPrisma.prisma) {
          globalForPrisma.prisma = new PrismaClient({ adapter });
        }
        prismaInstance = globalForPrisma.prisma;
      }
    } catch (e) {
      console.error("Prisma 7 adapter initialization failed:", e);
      prismaInstance = null as any;
    }
  } else {
    prismaInstance = null as any;
  }
} else {
  prismaInstance = null as any;
}

export const prisma = prismaInstance;
