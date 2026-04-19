const http = require('http');

async function test() {
  // 1. Get token
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@examiq.com', password: 'password123' })
  });
  if (!res.ok) {
    // maybe password is 'password'
    const res2 = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@examiq.com', password: 'password' })
    });
    if (!res2.ok) {
       console.log("LOGIN FAILED", await res2.text());
       return;
    }
  }
}
test();
