const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cron/check-contracts',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test_secret'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Body:', data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
