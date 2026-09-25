const http = require('http');

const data = JSON.stringify({
  name: 'test2',
  email: 'test2@gmail.com',
  password: '123',
  role: 'CANDIDATE'
});

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (error) => console.error(error));
req.write(data);
req.end();
