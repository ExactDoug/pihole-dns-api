const fs = require('fs');
const config = require('../config');

function readRecords() {
  const data = fs.readFileSync(config.dnsFilePath, 'utf8');
  return data
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.trim().split(/\s+/);
      return { ip: parts[0], domain: parts[1] };
    });
}

function recordExists(ip, domain) {
  try {
    const records = readRecords();
    return records.some(r => r.ip === ip && r.domain === domain);
  } catch (err) {
    return false;
  }
}

function addRecord(ip, domain) {
  backupFile();
  fs.appendFileSync(config.dnsFilePath, `${ip} ${domain}\n`);
}

function deleteRecord(ip, domain) {
  const data = fs.readFileSync(config.dnsFilePath, 'utf8');
  const newData = data
    .split('\n')
    .filter(line => {
      const parts = line.trim().split(/\s+/);
      return !(parts[0] === ip && parts[1] === domain);
    })
    .join('\n');
  fs.writeFileSync(config.dnsFilePath, newData);
}

function backupFile() {
  fs.copyFileSync(config.dnsFilePath, config.dnsFileBackupPath);
}

function restoreFromBackup() {
  fs.copyFileSync(config.dnsFileBackupPath, config.dnsFilePath);
}

function isFileAccessible() {
  try {
    fs.accessSync(config.dnsFilePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function getRecordCount() {
  try {
    return readRecords().length;
  } catch {
    return 0;
  }
}

module.exports = {
  readRecords,
  recordExists,
  addRecord,
  deleteRecord,
  backupFile,
  restoreFromBackup,
  isFileAccessible,
  getRecordCount,
};
