const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const ANON_KEY = process.env.SUPABASE_KEY;
const PROJECT = process.env.SUPABASE_PROJECT;

async function runSetup() {
  // Read the SQL file
  const sqlFile = path.join(__dirname, 'supabase', 'setup.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Running PowerPod database setup...');

  try {
    const response = await fetch(`https://${PROJECT}.supabase.co/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'params=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.text();
    console.log('Result:', result);

    if (response.ok) {
      console.log('Database setup completed!');
    } else {
      console.log('Error:', result);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runSetup();