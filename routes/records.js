const express = require('express');
const dnsFile = require('../services/dnsFile');
const pihole = require('../services/pihole');
const { validateRecordInput } = require('../validators/dns');

const router = express.Router();

// GET / - List all DNS records
router.get('/', (req, res, next) => {
  try {
    const records = dnsFile.readRecords();
    res.json(records.map(r => ({ IP: r.ip, record: r.domain })));
  } catch (err) {
    next(err);
  }
});

// POST /add - Add a DNS record
router.post('/add', async (req, res, next) => {
  try {
    const validation = validateRecordInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { IP, record } = req.body;

    if (dnsFile.recordExists(IP, record)) {
      return res.status(409).json({ message: 'Record already present' });
    }

    dnsFile.addRecord(IP, record);
    await pihole.restartDns();
    res.json({ message: 'Record added successfully and DNS service restarted' });
  } catch (err) {
    next(err);
  }
});

// POST /delete - Delete a DNS record
router.post('/delete', async (req, res, next) => {
  try {
    const validation = validateRecordInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const { IP, record } = req.body;

    if (!dnsFile.recordExists(IP, record)) {
      return res.status(404).json({ message: 'Record not found' });
    }

    dnsFile.deleteRecord(IP, record);
    await pihole.restartDns();
    res.json({ message: 'Record deleted successfully and DNS service restarted' });
  } catch (err) {
    next(err);
  }
});

// GET /reset - Restore from backup
router.get('/reset', async (req, res, next) => {
  try {
    dnsFile.restoreFromBackup();
    await pihole.restartDns();
    res.json({ message: 'Records reset successfully and DNS service restarted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
