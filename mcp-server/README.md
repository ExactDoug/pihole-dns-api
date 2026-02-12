# Pi-hole DNS MCP Server

An MCP (Model Context Protocol) server that enables Claude Desktop, Claude Code, and other MCP-compatible tools to manage Pi-hole local DNS records.

## Prerequisites

- Node.js 18+
- The Pi-hole DNS REST API running on your Pi-hole host (see root project README)

## Build

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

The server reads two environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PIHOLE_DNS_API_URL` | URL of the Pi-hole DNS REST API | `http://localhost:3000` |
| `API_KEY` | API key for authentication (if enabled on the API) | _(empty — no auth)_ |

## Claude Desktop

Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "pihole-dns": {
      "command": "node",
      "args": ["C:\\dev\\projects\\github\\pi-hole-api\\mcp-server\\build\\index.js"],
      "env": {
        "PIHOLE_DNS_API_URL": "http://<PIHOLE_IP>:3000",
        "API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

## Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "pihole-dns": {
      "command": "node",
      "args": ["/mnt/c/dev/projects/github/pi-hole-api/mcp-server/build/index.js"],
      "env": {
        "PIHOLE_DNS_API_URL": "http://<PIHOLE_IP>:3000",
        "API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `pihole_dns_list` | List all local DNS records | _(none)_ |
| `pihole_dns_add` | Add a DNS record | `ip` (string), `domain` (string) |
| `pihole_dns_delete` | Delete a DNS record | `ip` (string), `domain` (string) |
| `pihole_dns_reset` | Restore from backup | _(none)_ |
| `pihole_dns_health` | Check API server health | _(none)_ |

## Testing with MCP Inspector

```bash
npm run inspect
```

This launches the MCP Inspector UI where you can see all registered tools and call them interactively.

## Troubleshooting

**Tools not appearing:** Ensure `npm run build` completed without errors and the path in your config points to `build/index.js`.

**Connection refused:** Verify `PIHOLE_DNS_API_URL` is correct and the Pi-hole DNS API is running on the target host.

**Authentication errors:** If the API has authentication enabled, set the `API_KEY` environment variable to match the API's configured key.

**Build errors:** Run `npm install` first. Requires Node.js 18+ and TypeScript 5+.
