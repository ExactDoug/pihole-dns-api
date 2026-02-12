const { exec } = require('child_process');
const config = require('../config');

function restartDns() {
  return new Promise((resolve, reject) => {
    exec(config.piholeRestartCmd, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`DNS restart failed: ${error.message}`));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

function isPiholeAvailable() {
  return new Promise((resolve) => {
    exec('which pihole', (error) => {
      resolve(!error);
    });
  });
}

module.exports = { restartDns, isPiholeAvailable };
