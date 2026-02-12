import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createClient } from "./client.js";

export function registerTools(server: McpServer): void {
  const client = createClient();

  server.tool(
    "pihole_dns_list",
    "List all local DNS records configured in Pi-hole",
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
    "Add a local DNS record to Pi-hole",
    {
      ip: z.string().describe("IP address (e.g. 192.168.1.100)"),
      domain: z.string().describe("Domain name (e.g. myserver.lan)"),
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
    "Delete a local DNS record from Pi-hole",
    {
      ip: z.string().describe("IP address of the record to delete"),
      domain: z.string().describe("Domain name of the record to delete"),
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
    "Restore DNS records from the most recent backup",
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
    "Check the health of the Pi-hole DNS API server",
    {},
    async () => {
      try {
        const health = await client.health();
        const lines = [
          `Status: ${health.status}`,
          `Uptime: ${health.uptime}s`,
          `DNS File: ${health.checks.dnsFile}`,
          `Pi-hole: ${health.checks.pihole}`,
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
