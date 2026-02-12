function isValidIPv4(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = Number(part);
    return /^\d{1,3}$/.test(part) && num >= 0 && num <= 255;
  });
}

function isValidIPv6(ip) {
  const pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const compressedPattern = /^(([0-9a-fA-F]{1,4}:)*):?(([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4})?$/;
  if (pattern.test(ip)) return true;
  if (!ip.includes('::')) return false;
  if ((ip.match(/::/g) || []).length > 1) return false;
  return compressedPattern.test(ip);
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
