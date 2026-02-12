import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createClient } from "./client.js";

export function registerTools(server: McpServer): void {
  const client = createClient();

  server.tool(
    "pihole_dns_list",
    "List all local DNS records configured in Pi-hole. Returns IP/domain pairs from /etc/pihole/custom.list. Use this to see what DNS overrides are active. Example uses: 'list all DNS records', 'what domains point to 192.168.1.10', 'show me the Pi-hole local DNS config'.",
    {},
    async () => {
      try {
        const records = await client.listRecords();
        if (records.length === 0) {
          return { content: [{ type: "text", text: "No DNS records found." }] };
        }
        const lines = records.map((r) => `${r.IP}\t${r.record}`);
        const text = `${records.length} DNS record(s):\n\n${lines.join("\n")}`;
        return { content: [{ type: "text", text }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error listing records: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "pihole_dns_add",
    "Add a local DNS record to Pi-hole. Creates a backup, appends the record to custom.list, and restarts Pi-hole DNS. Fails if the IP/domain pair already exists. Example uses: 'point myapp.lan to 192.168.1.50', 'add DNS record for printer.home.lab at 10.0.0.25'.",
    {
      ip: z.string().describe("IPv4 or IPv6 address (e.g. 192.168.1.100 or fd12::1)"),
      domain: z.string().describe("Fully qualified domain name (e.g. myserver.lan, app.home.lab)"),
    },
    async ({ ip, domain }) => {
      try {
        const result = await client.addRecord(ip, domain);
        return { content: [{ type: "text", text: result.message }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error adding record: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "pihole_dns_delete",
    "Delete a local DNS record from Pi-hole. Removes the matching IP/domain pair and restarts Pi-hole DNS. Both IP and domain must match exactly. Example uses: 'remove the DNS entry for old-server.lan', 'delete 192.168.1.50 myapp.lan'.",
    {
      ip: z.string().describe("IPv4 or IPv6 address — must match an existing record exactly"),
      domain: z.string().describe("Domain name — must match an existing record exactly"),
    },
    async ({ ip, domain }) => {
      try {
        const result = await client.deleteRecord(ip, domain);
        return { content: [{ type: "text", text: result.message }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error deleting record: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "pihole_dns_reset",
    "Restore DNS records from the most recent backup. Replaces custom.list with the backup created during the last add operation, then restarts Pi-hole DNS. Use with caution — this reverts all changes since the last add. Example uses: 'undo the last DNS change', 'restore DNS records from backup'.",
    {},
    async () => {
      try {
        const result = await client.resetRecords();
        return { content: [{ type: "text", text: result.message }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error resetting records: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "pihole_dns_health",
    "Check the health of the Pi-hole DNS API server. Returns status (ok/degraded), uptime, DNS file accessibility with record count, and pihole command availability. Example uses: 'is the Pi-hole API running', 'check Pi-hole DNS health status'.",
    {},
    async () => {
      try {
        const health = await client.health();
        const lines = [
          `Status: ${health.status}`,
          `Uptime: ${Math.round(health.uptime)}s`,
          `DNS File: ${JSON.stringify(health.checks.dnsFile)}`,
          `Pi-hole: ${JSON.stringify(health.checks.pihole)}`,
        ];
        return { content: [{ type: "text", text: lines.join("\n") }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error checking health: ${(err as Error).message}` }],
          isError: true,
        };
      }
    }
  );
}
