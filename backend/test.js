const http = require('http');

const BASE = process.env.TEST_URL || 'http://localhost:5000';

let passed = 0;
let failed = 0;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(name, condition) {
  if (condition) {
    console.log(`  PASS: ${name}`);
    passed++;
  } else {
    console.log(`  FAIL: ${name}`);
    failed++;
  }
}

async function runTests() {
  console.log('Running backend API tests...\n');

  // Test 1: Login with valid credentials
  try {
    const res = await request('POST', '/api/login', { username: 'admin', password: 'admin123' });
    assert('Login returns 200', res.status === 200);
    assert('Login returns success', res.body.success === true);
    assert('Login returns admin role', res.body.user.role === 'Admin');
  } catch (e) {
    assert('Login request succeeds', false);
  }

  // Test 2: Login with invalid credentials
  try {
    const res = await request('POST', '/api/login', { username: 'wrong', password: 'wrong' });
    assert('Invalid login returns 401', res.status === 401);
    assert('Invalid login returns failure', res.body.success === false);
  } catch (e) {
    assert('Invalid login request succeeds', false);
  }

  // Test 3: Get books
  try {
    const res = await request('GET', '/api/books?page=1&limit=5');
    assert('Get books returns 200', res.status === 200);
    assert('Get books returns array', Array.isArray(res.body.books));
    assert('Get books has pagination', typeof res.body.totalPages === 'number');
  } catch (e) {
    assert('Get books request succeeds', false);
  }

  // Test 4: Get categories
  try {
    const res = await request('GET', '/api/categories');
    assert('Get categories returns 200', res.status === 200);
    assert('Get categories returns array', Array.isArray(res.body));
  } catch (e) {
    assert('Get categories request succeeds', false);
  }

  // Test 5: Get analytics
  try {
    const res = await request('GET', '/api/analytics');
    assert('Get analytics returns 200', res.status === 200);
    assert('Analytics has totalBooks', typeof res.body.totalBooks === 'number');
  } catch (e) {
    assert('Get analytics request succeeds', false);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
