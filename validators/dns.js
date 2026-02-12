function isValidIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part[0] === '0') return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

function isValidIPv6(ip) {
  if (!ip || typeof ip !== 'string') return false;
  // Full form: 8 groups of hex
  if (/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip)) return true;
  // Must contain :: for compressed form
  if (!ip.includes('::')) return false;
  // Only one :: allowed
  if ((ip.match(/::/g) || []).length > 1) return false;
  // Split on :: and validate each side
  const sides = ip.split('::');
  const left = sides[0] ? sides[0].split(':') : [];
  const right = sides[1] ? sides[1].split(':') : [];
  // Total groups must be <= 8
  if (left.length + right.length > 7) return false;
  const hexGroup = /^[0-9a-fA-F]{1,4}$/;
  return left.every(g => hexGroup.test(g)) && right.every(g => hexGroup.test(g));
}

function isValidIP(ip) {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

function isValidDomain(domain) {
  if (!domain || domain.length > 253) return false;
  const labels = domain.split('.');
  if (labels.length < 1) return false;
  return labels.every(label => {
    if (label.length === 0 || label.length > 63) return false;
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label);
  });
}

function validateRecordInput(body) {
  if (!body || !body.IP || !body.record) {
    return { valid: false, error: 'Both IP and record fields are required' };
  }
  if (!isValidIP(body.IP)) {
    return { valid: false, error: `Invalid IP address: ${body.IP}` };
  }
  if (!isValidDomain(body.record)) {
    return { valid: false, error: `Invalid domain name: ${body.record}` };
  }
  return { valid: true, error: null };
}

module.exports = {
  isValidIPv4,
  isValidIPv6,
  isValidIP,
  isValidDomain,
  validateRecordInput,
};
