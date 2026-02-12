#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const PiholeDnsClient = require('./PiholeDnsClient');

const client = new PiholeDnsClient();

const [,, command, ...args] = process.argv;

const commands = {
  async list() {
    const records = await client.listRecords();
    if (records.length === 0) {
      console.log('No records found.');
      return;
    }
    const maxIP = Math.max(...records.map(r => r.IP.length), 2);
    for (const r of records) {
      console.log(`${r.IP.padEnd(maxIP)}  ${r.record}`);
    }
    console.log(`\n${records.length} record(s)`);
  },

  async add() {
    if (args.length < 2) {
      console.error('Usage: pihole-dns add <ip> <domain>');
      process.exit(1);
    }
    const result = await client.addRecord(args[0], args[1]);
    console.log(result.message);
  },

  async delete() {
    if (args.length < 2) {
      console.error('Usage: pihole-dns delete <ip> <domain>');
      process.exit(1);
    }
    const result = await client.deleteRecord(args[0], args[1]);
    console.log(result.message);
  },

  async reset() {
    const result = await client.resetRecords();
    console.log(result.message);
  },

  async health() {
    const result = await client.health();
    console.log(`Status: ${result.status}`);
    console.log(`Uptime: ${Math.round(result.uptime)}s`);
    for (const [name, check] of Object.entries(result.checks)) {
      console.log(`  ${name}: ${check.status}${check.recordCount != null ? ` (${check.recordCount} records)` : ''}`);
    }
  },
};

async function main() {
  if (!command || !commands[command]) {
    console.log('Pi-hole DNS API Client\n');
    console.log('Usage: node client/cli.js <command> [args]\n');
    console.log('Commands:');
    console.log('  list               List all DNS records');
    console.log('  add <ip> <domain>  Add a DNS record');
    console.log('  delete <ip> <domain>  Delete a DNS record');
    console.log('  reset              Restore from backup');
    console.log('  health             Check service health');
    process.exit(0);
  }

  try {
    await commands[command]();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
