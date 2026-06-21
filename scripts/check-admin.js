require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.personel.findUnique({
      where: { kullaniciAdi: 'admin' }
    });
    console.log("=== ADMIN USER INFO ===");
    console.log(user);
    console.log("=======================");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
