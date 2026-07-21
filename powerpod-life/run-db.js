const https = require('https');

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bHRiZ2Zjd3lsbm91bnV6c3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk5MDQ0MCwiZXhwIjoyMDkyNTY2NDQwfQ.nxE61ykiOOK48pE9Ni6G_eT939dU22grABjdHEOIwVw';
const PROJECT = 'pxltbgfcwylnounuzszg';
const fs = require('fs');

// Read SQL setup file
const sql = fs.readFileSync('./supabase/setup.sql', 'utf8');

// Split into individual statements (simplified - handle semicolons)
const statements = sql.split(';').filter(s => s.trim().length > 0);

console.log(`Running ${statements.length} SQL statements...`);

// Execute each statement sequentially
async function runStatements() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt || stmt.startsWith('--') || stmt.startsWith('=') || stmt.startsWith('SELECT')) {
      if (stmt.startsWith('SELECT')) {
        try {
          await executeSQL(stmt);
          successCount++;
          console.log(`✓ Statement ${i+1}: ${stmt.substring(0,50)}...`);
        } catch (e) {
          console.log(`✗ Error: ${e.message}`);
        }
      }
      continue;
    }

    try {
      await executeSQL(stmt);
      successCount++;
      console.log(`✓ Statement ${i+1}: ${stmt.substring(0,50)}...`);
    } catch (e) {
      errorCount++;
      console.log(`✗ Statement ${i+1} Error: ${e.message.substring(0,100)}`);
    }
  }

  console.log(`\nComplete: ${successCount} successful, ${errorCount} errors`);
}

function executeSQL(query) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query });
    
    const options = {
      hostname: `${PROJECT}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'params=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

runStatements();