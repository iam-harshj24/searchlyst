import pg from 'pg';

const connectionString = 'postgresql://admin:admin951753@34.131.130.234:5432/searchlyst';

const client = new pg.Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('\n--- Public Tables ---');
    if (res.rows.length === 0) {
      console.log('No tables found in public schema.');
    } else {
      res.rows.forEach(row => console.log(`- ${row.table_name}`));
    }
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

run();
