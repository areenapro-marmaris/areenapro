require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const records = await prisma.tutanak.findMany({
      include: {
        ekleyen: true,
        ilgili: true
      }
    });
    console.log("=== TUTANAK KAYITLARI ===");
    records.forEach(r => {
      console.log(`ID: ${r.id}`);
      console.log(`  Konu: ${r.konu}`);
      console.log(`  Durum: ${r.durum}`);
      console.log(`  Ekleyen: ${r.ekleyen?.adSoyad} (${r.ekleyenId})`);
      console.log(`  İlgili: ${r.ilgili?.adSoyad} (${r.ilgiliId})`);
      console.log(`  Savunma: ${r.savunma}`);
    });
    console.log("=========================");
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
