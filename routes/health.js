const express = require('express');
const dnsFile = require('../services/dnsFile');
const pihole = require('../services/pihole');
const config = require('../config');

const router = express.Router();

router.get('/health', async (req, res) => {
  const checks = {};
  let overall = 'ok';

  // Check DNS file accessibility
  if (dnsFile.isFileAccessible()) {
    checks.dnsFile = {
      status: 'ok',
      path: config.dnsFilePath,
      recordCount: dnsFile.getRecordCount(),
    };
  } else {
    checks.dnsFile = {
      status: 'error',
      path: config.dnsFilePath,
      error: 'File not accessible',
    };
    overall = 'degraded';
  }

  // Check Pi-hole availability
  const piholeAvailable = await pihole.isPiholeAvailable();
  if (piholeAvailable) {
    checks.pihole = { status: 'ok' };
  } else {
    checks.pihole = { status: 'error', error: 'pihole command not found' };
    overall = 'degraded';
  }

  const statusCode = overall === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    status: overall,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

module.exports = router;
