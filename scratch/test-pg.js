const pg = require('pg');
const connectionString = "postgresql://neondb_owner:npg_i1DvqUr7clzV@ep-falling-block-a2enyii7.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  console.log("Connecting directly using pg Pool...");
  const pool = new pg.Pool({ 
    connectionString,
    connectionTimeoutMillis: 5000 // 5 seconds timeout
  });
  
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PG!");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
    client.release();
  } catch (err) {
    console.error("Direct PG connection failed:", err);
  } finally {
    await pool.end();
  }
}

main();
