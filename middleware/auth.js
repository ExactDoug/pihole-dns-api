const crypto = require('crypto');
const config = require('../config');

function auth(req, res, next) {
  if (!config.apiKey) {
    return next();
  }

  const providedKey = req.headers['x-api-key'] || req.query.api_key;

  if (!providedKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  const expected = Buffer.from(config.apiKey);
  const provided = Buffer.from(String(providedKey));

  if (expected.length !== provided.length ||
      !crypto.timingSafeEqual(expected, provided)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = auth;
