const http = require('http');
const https = require('https');

class PiholeDnsClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.PIHOLE_DNS_API_URL || 'http://localhost:3000';
    this.apiKey = options.apiKey || process.env.API_KEY || '';
    this.timeout = options.timeout || 10000;
  }

  async _request(method, path, body = null) {
    const url = new URL(path, this.baseUrl);
    const lib = url.protocol === 'https:' ? https : http;

    const headers = { 'Content-Type': 'application/json' };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const payload = body ? JSON.stringify(body) : null;

    return new Promise((resolve, reject) => {
      const req = lib.request(url, { method, headers, timeout: this.timeout }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 400) {
              const err = new Error(parsed.error || parsed.message || `HTTP ${res.statusCode}`);
              err.status = res.statusCode;
              err.body = parsed;
              reject(err);
            } else {
              resolve(parsed);
            }
          } catch {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      if (payload) req.write(payload);
      req.end();
    });
  }

  async listRecords() {
    return this._request('GET', '/');
  }

  async addRecord(ip, domain) {
    return this._request('POST', '/add', { IP: ip, record: domain });
  }

  async deleteRecord(ip, domain) {
    return this._request('POST', '/delete', { IP: ip, record: domain });
  }

  async resetRecords() {
    return this._request('GET', '/reset');
  }

  async health() {
    return this._request('GET', '/health');
  }
}

module.exports = PiholeDnsClient;
