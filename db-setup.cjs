const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres.fvpapjdflprmkrqxkzkl:$Hydrogen5@aws-1-eu-west-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  try {
    const sql = fs.readFileSync('supabase/schema.sql', 'utf8');
    await client.connect();
    console.log('Connected to Supabase');
    await client.query(sql);
    console.log('SQL EXECUTED');
  } catch (err) {
    console.error('Database Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
