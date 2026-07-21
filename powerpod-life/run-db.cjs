const https = require('https');
const fs = require('fs');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bHRiZ2Zjd3lsbm91bnV6c3pnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk5MDQ0MCwiZXhwIjoyMDkyNTY2NDQwfQ.nxE61ykiOOK48pE9Ni6G_eT939dU22grABjdHEOIwVw';
const PROJECT = 'pxltbgfcwylnounuzszg';

// Read SQL setup file - it's one level up
const sql = fs.readFileSync('../supabase/setup.sql', 'utf8');

console.log('Running PowerPod database setup via Management API...');
console.log('SQL loaded:', sql.length, 'characters');

const body = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (data.length < 5000) {
      console.log('Response:', data);
    } else {
      console.log('Response:', data.substring(0, 3000));
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();