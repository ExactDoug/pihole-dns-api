const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { exec } = require('child_process');
const config = require('./config');

const app = express();

app.use(cors());
app.use(express.json());

function isRecordPresent(IP, record) {
  try {
    const data = fs.readFileSync(config.dnsFilePath, 'utf8');
    const lines = data.trim().split('\n');
    for (const line of lines) {
      const [storedIP, storedRecord] = line.trim().split(' ');
      if (storedIP === IP && storedRecord === record) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error(`Error reading ${config.dnsFilePath}: ${err.message}`);
    return false;
  }
}

app.post('/add', (req, res) => {
  const { IP, record } = req.body;
  if (!IP || !record) {
    return res.status(400).json({ error: 'Both IP and record fields are required' });
  }

  if (isRecordPresent(IP, record)) {
    return res.status(409).json({ message: 'Record already present' });
  }

  fs.copyFile(config.dnsFilePath, config.dnsFileBackupPath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error copying file:', err);
      return res.status(500).json({ error: 'Error creating backup' });
    }

    fs.appendFile(config.dnsFilePath, `${IP} ${record}\n`, (err) => {
      if (err) {
        console.error('Error appending record:', err);
        return res.status(500).json({ error: 'Error appending record' });
      }

      exec(config.piholeRestartCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error restarting DNS: ${error.message}`);
          return res.status(500).json({ error: 'Error restarting DNS service' });
        }
        res.json({ message: 'Record added successfully and DNS service restarted' });
      });
    });
  });
});

app.post('/delete', (req, res) => {
  const { IP, record } = req.body;
  if (!IP || !record) {
    return res.status(400).json({ error: 'Both IP and record fields are required' });
  }

  if (!isRecordPresent(IP, record)) {
    return res.status(404).json({ message: 'Record not found' });
  }

  try {
    const data = fs.readFileSync(config.dnsFilePath, 'utf8');
    const newData = data.split('\n').filter(line => {
      const [storedIP, storedRecord] = line.trim().split(' ');
      return !(storedIP === IP && storedRecord === record);
    }).join('\n');
    fs.writeFileSync(config.dnsFilePath, newData);
  } catch (err) {
    console.error(`Error deleting record: ${err.message}`);
    return res.status(500).json({ error: 'Error deleting record' });
  }

  exec(config.piholeRestartCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error restarting DNS: ${error.message}`);
      return res.status(500).json({ error: 'Error restarting DNS service' });
    }
    res.json({ message: 'Record deleted successfully and DNS service restarted' });
  });
});

app.get('/reset', (req, res) => {
  fs.copyFile(config.dnsFileBackupPath, config.dnsFilePath, (err) => {
    if (err) {
      console.error('Error restoring backup:', err);
      return res.status(500).json({ error: 'Error restoring from backup' });
    }

    exec(config.piholeRestartCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error restarting DNS: ${error.message}`);
        return res.status(500).json({ error: 'Error restarting DNS service' });
      }
      res.json({ message: 'Records reset successfully and DNS service restarted' });
    });
  });
});

app.get('/', (req, res) => {
  try {
    const data = fs.readFileSync(config.dnsFilePath, 'utf8');
    const lines = data.trim().split('\n');
    const records = lines
      .filter(line => line.trim())
      .map(line => {
        const [IP, record] = line.trim().split(' ');
        return { IP, record };
      });
    res.json(records);
  } catch (err) {
    console.error(`Error reading ${config.dnsFilePath}: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(config.port, () => {
  console.log(`Pi-hole DNS API running on http://localhost:${config.port}`);
});
