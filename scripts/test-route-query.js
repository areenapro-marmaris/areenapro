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
    const targetTarih = new Date().toISOString().split('T')[0];
    console.log('Target Date:', targetTarih);
    
    console.log('Querying findUnique...');
    let dbRecord = await prisma.elektraSatis.findUnique({
      where: { tarih: targetTarih }
    });
    console.log('findUnique Result:', dbRecord);

    if (!dbRecord) {
      console.log('Querying findFirst...');
      dbRecord = await prisma.elektraSatis.findFirst({
        orderBy: { tarih: 'desc' }
      });
      console.log('findFirst Result:', dbRecord);
    }

    if (dbRecord) {
      const payload = {
        tarih: dbRecord.tarih,
        toplamSatis: dbRecord.toplamSatis,
        personelListesi: dbRecord.personelListesi,
        sonGuncelleme: dbRecord.sonGuncelleme.toLocaleTimeString('tr-TR'),
        source: 'cache',
        cacheAge: 'Yerel Sunucudan Alındı'
      };
      console.log('Payload generated successfully:', payload);
    } else {
      console.log('No record found in DB.');
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
