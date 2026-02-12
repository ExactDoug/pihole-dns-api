const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');

jest.setTimeout(10000);

let testFile;
let backupFile;

beforeEach(() => {
  // Create temp files for testing
  const tmpDir = os.tmpdir();
  testFile = path.join(tmpDir, `dns-test-${Date.now()}.list`);
  backupFile = testFile + '.old';
  fs.writeFileSync(testFile, '192.168.1.1 existing.home.lab\n');

  // Override config before requiring app
  process.env.DNS_FILE_PATH = testFile;
  process.env.DNS_FILE_BACKUP_PATH = backupFile;
  process.env.PIHOLE_RESTART_CMD = 'echo restarted';
  process.env.API_KEY = '';

  // Clear module cache to pick up new config
  jest.resetModules();
});

afterEach(() => {
  try { fs.unlinkSync(testFile); } catch {}
  try { fs.unlinkSync(backupFile); } catch {}
});

function getApp() {
  return require('../app');
}

describe('GET /', () => {
  test('returns list of records', async () => {
    const app = getApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ IP: '192.168.1.1', record: 'existing.home.lab' }]);
  });
});

describe('POST /add', () => {
  test('adds a new record', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/add')
      .send({ IP: '192.168.1.2', record: 'new.home.lab' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('added successfully');

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).toContain('192.168.1.2 new.home.lab');
  });

  test('rejects duplicate record', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/add')
      .send({ IP: '192.168.1.1', record: 'existing.home.lab' });
    expect(res.status).toBe(409);
  });

  test('rejects invalid input', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/add')
      .send({ IP: 'bad', record: 'test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid IP');
  });

  test('rejects missing fields', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/add')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /delete', () => {
  test('deletes an existing record', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/delete')
      .send({ IP: '192.168.1.1', record: 'existing.home.lab' });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted successfully');

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).not.toContain('192.168.1.1 existing.home.lab');
  });

  test('returns 404 for missing record', async () => {
    const app = getApp();
    const res = await request(app)
      .post('/delete')
      .send({ IP: '10.0.0.1', record: 'missing.home.lab' });
    expect(res.status).toBe(404);
  });
});

describe('GET /health', () => {
  test('returns health status', async () => {
    const app = getApp();
    const res = await request(app).get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body.status).toBeDefined();
    expect(res.body.checks).toBeDefined();
    expect(res.body.checks.dnsFile).toBeDefined();
    expect(res.body.checks.dnsFile.status).toBe('ok');
    expect(res.body.uptime).toBeDefined();
  });
});

describe('GET /reset', () => {
  test('restores from backup', async () => {
    const app = getApp();
    // First add a record to create backup
    await request(app)
      .post('/add')
      .send({ IP: '192.168.1.99', record: 'temp.home.lab' });

    // Reset should restore
    const res = await request(app).get('/reset');
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('reset successfully');

    const content = fs.readFileSync(testFile, 'utf8');
    expect(content).not.toContain('192.168.1.99');
  });
});
