require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  dnsFilePath: process.env.DNS_FILE_PATH || '/etc/pihole/custom.list',
  dnsFileBackupPath: process.env.DNS_FILE_BACKUP_PATH || '/etc/pihole/custom.list.old',
  piholeRestartCmd: process.env.PIHOLE_RESTART_CMD || 'pihole restartdns',
  apiKey: process.env.API_KEY || '',
};
