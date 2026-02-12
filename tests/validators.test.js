const {
  isValidIPv4,
  isValidIPv6,
  isValidIP,
  isValidDomain,
  validateRecordInput,
} = require('../validators/dns');

describe('isValidIPv4', () => {
  test('accepts valid IPv4 addresses', () => {
    expect(isValidIPv4('192.168.1.1')).toBe(true);
    expect(isValidIPv4('10.0.0.1')).toBe(true);
    expect(isValidIPv4('0.0.0.0')).toBe(true);
    expect(isValidIPv4('255.255.255.255')).toBe(true);
    expect(isValidIPv4('172.16.0.1')).toBe(true);
  });

  test('rejects invalid IPv4 addresses', () => {
    expect(isValidIPv4('256.1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1')).toBe(false);
    expect(isValidIPv4('1.1.1.1.1')).toBe(false);
    expect(isValidIPv4('abc.def.ghi.jkl')).toBe(false);
    expect(isValidIPv4('')).toBe(false);
    expect(isValidIPv4('192.168.1.1/24')).toBe(false);
    expect(isValidIPv4('192.168.01.1')).toBe(false);
  });
});

describe('isValidIPv6', () => {
  test('accepts valid IPv6 addresses', () => {
    expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    expect(isValidIPv6('::1')).toBe(true);
    expect(isValidIPv6('::')).toBe(true);
    expect(isValidIPv6('fe80::1')).toBe(true);
  });

  test('rejects invalid IPv6 addresses', () => {
    expect(isValidIPv6('192.168.1.1')).toBe(false);
    expect(isValidIPv6(':::1')).toBe(false);
    expect(isValidIPv6('')).toBe(false);
    expect(isValidIPv6('zzzz::1')).toBe(false);
  });
});

describe('isValidIP', () => {
  test('accepts both IPv4 and IPv6', () => {
    expect(isValidIP('192.168.1.1')).toBe(true);
    expect(isValidIP('::1')).toBe(true);
  });

  test('rejects invalid IPs', () => {
    expect(isValidIP('not-an-ip')).toBe(false);
    expect(isValidIP('')).toBe(false);
  });
});

describe('isValidDomain', () => {
  test('accepts valid domain names', () => {
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('sub.example.com')).toBe(true);
    expect(isValidDomain('my-server.home.lab')).toBe(true);
    expect(isValidDomain('a.b.c.d.e')).toBe(true);
    expect(isValidDomain('localhost')).toBe(true);
    expect(isValidDomain('test123')).toBe(true);
  });

  test('rejects invalid domain names', () => {
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain(null)).toBe(false);
    expect(isValidDomain(undefined)).toBe(false);
    expect(isValidDomain('-example.com')).toBe(false);
    expect(isValidDomain('example-.com')).toBe(false);
    expect(isValidDomain('.example.com')).toBe(false);
    expect(isValidDomain('exam ple.com')).toBe(false);
    expect(isValidDomain('a'.repeat(254))).toBe(false);
  });
});

describe('validateRecordInput', () => {
  test('accepts valid input', () => {
    const result = validateRecordInput({ IP: '192.168.1.1', record: 'test.home.lab' });
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('rejects missing fields', () => {
    expect(validateRecordInput({}).valid).toBe(false);
    expect(validateRecordInput({ IP: '1.1.1.1' }).valid).toBe(false);
    expect(validateRecordInput({ record: 'test.com' }).valid).toBe(false);
    expect(validateRecordInput(null).valid).toBe(false);
    expect(validateRecordInput(undefined).valid).toBe(false);
  });

  test('rejects invalid IP', () => {
    const result = validateRecordInput({ IP: 'bad-ip', record: 'test.com' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid IP');
  });

  test('rejects invalid domain', () => {
    const result = validateRecordInput({ IP: '192.168.1.1', record: '-bad.com' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid domain');
  });
});
