require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Connecting to:', connectionString);
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Upserting record for date:', today);
    
    const record = await prisma.elektraSatis.upsert({
      where: { tarih: today },
      update: {
        toplamSatis: 125000,
        personelListesi: [
          { adSoyad: 'Yakup Cagin', departman: 'Garson', satis: 55000, masaSayisi: 12 },
          { adSoyad: 'Oguzhan Kaya', departman: 'Bar', satis: 70000, masaSayisi: 15 }
        ],
        sonGuncelleme: new Date()
      },
      create: {
        tarih: today,
        toplamSatis: 125000,
        personelListesi: [
          { adSoyad: 'Yakup Cagin', departman: 'Garson', satis: 55000, masaSayisi: 12 },
          { adSoyad: 'Oguzhan Kaya', departman: 'Bar', satis: 70000, masaSayisi: 15 }
        ],
        sonGuncelleme: new Date()
      }
    });
    
    console.log('Successfully upserted record:', record);
    
    // Test findFirst
    const firstRecord = await prisma.elektraSatis.findFirst({
      orderBy: { tarih: 'desc' }
    });
    console.log('Successfully queried record:', firstRecord);
  } catch (err) {
    console.error('Error during database operation:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
