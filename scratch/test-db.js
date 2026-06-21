const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log("Database connection successful:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
