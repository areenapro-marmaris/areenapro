require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function test() {
  const connectionString = process.env.DATABASE_URL;
  console.log('Using connection string:', connectionString);
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Attempting to create a test company...');
    const result = await prisma.sirket.create({
      data: { ad: 'Test Sirketi ' + Date.now() }
    });
    console.log('Success!', result);
  } catch (error) {
    console.error('Error occurred during insert:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
