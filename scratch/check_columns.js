require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Tutanak';
    `);
    console.log("Columns in Tutanak table:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
