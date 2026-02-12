import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Bridge to CJS client — path resolves from build/client.js → ../../client/PiholeDnsClient.js
const PiholeDnsClient = require("../../client/PiholeDnsClient");

export interface DnsRecord {
  IP: string;
  record: string;
}

export interface HealthCheck {
  status: string;
  uptime: number;
  checks: {
    dnsFile: string;
    pihole: string;
  };
}

export interface MessageResponse {
  message: string;
}

interface PiholeDnsClientInstance {
  listRecords(): Promise<DnsRecord[]>;
  addRecord(ip: string, domain: string): Promise<MessageResponse>;
  deleteRecord(ip: string, domain: string): Promise<MessageResponse>;
  resetRecords(): Promise<MessageResponse>;
  health(): Promise<HealthCheck>;
}

export function createClient(): PiholeDnsClientInstance {
  const baseUrl = process.env.PIHOLE_DNS_API_URL || "http://localhost:3000";
  const apiKey = process.env.API_KEY || "";

  return new PiholeDnsClient({ baseUrl, apiKey }) as PiholeDnsClientInstance;
}
