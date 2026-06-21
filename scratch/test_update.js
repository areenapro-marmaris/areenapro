require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const t = await prisma.tutanak.findFirst();
    console.log("Found tutanak ID:", t?.id);
    if (t) {
      const updated = await prisma.tutanak.update({
        where: { id: t.id },
        data: {
          kararTuru: 'UYARI',
          cezaTutari: 0,
          kararNotu: 'test',
          kararTarihi: new Date(),
          durum: 'KARAR_VERILDI'
        }
      });
      console.log("Updated successfully:", updated);
    }
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
main();
