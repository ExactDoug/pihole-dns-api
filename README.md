# Pi-hole DNS API

REST API for managing Pi-hole v5 local DNS records over HTTP. Designed for integration with MCP servers, automation tools, and direct HTTP clients.

## Features

- **CRUD operations** for local DNS records (`/etc/pihole/custom.list`)
- **API key authentication** (optional, constant-time comparison)
- **Input validation** for IPv4, IPv6, and domain names
- **Health check endpoint** for monitoring and readiness probes
- **Backup/restore** support via automatic pre-mutation backups
- **Request logging** with timestamps and response duration
- **Configurable** entirely via environment variables
- **systemd deployment** with security hardening
- **Client library** for programmatic integration (Node.js)

## Quick Start

### Development

```bash
git clone https://github.com/ExactDoug/pihole-dns-api.git
cd pihole-dns-api
npm install
cp .env.example .env
# Edit .env — point DNS_FILE_PATH to a local test file
npm run dev
```

### Production (Pi-hole host)

```bash
git clone https://github.com/ExactDoug/pihole-dns-api.git
cd pihole-dns-api
sudo chmod +x deploy/install.sh
sudo ./deploy/install.sh
sudo nano /opt/pihole-dns-api/.env   # Set API_KEY
sudo systemctl start pihole-dns-api
```

## Configuration

All settings via environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `DNS_FILE_PATH` | `/etc/pihole/custom.list` | Pi-hole DNS records file |
| `DNS_FILE_BACKUP_PATH` | `/etc/pihole/custom.list.old` | Backup file path |
| `PIHOLE_RESTART_CMD` | `pihole restartdns` | Command to reload DNS |
| `API_KEY` | _(empty)_ | API key for authentication (empty = auth disabled) |

### Client-only variables (for `client/cli.js`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PIHOLE_DNS_API_URL` | `http://localhost:3000` | URL of the API server |

## API Endpoints

All endpoints return JSON. When `API_KEY` is set, endpoints (except `/health`) require authentication.

### `GET /health` — Health Check (no auth)

```bash
curl http://localhost:3000/health
```

Returns `200 OK` or `503 Service Unavailable`:

```json
{
  "status": "ok",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "dnsFile": { "status": "ok", "path": "/etc/pihole/custom.list", "recordCount": 5 },
    "pihole": { "status": "ok" }
  }
}
```

### `GET /` — List Records

```bash
curl -H "X-API-Key: YOUR_KEY" http://localhost:3000/
```

```json
[
  { "IP": "192.168.1.10", "record": "server.home.lab" },
  { "IP": "192.168.1.20", "record": "nas.home.lab" }
]
```

### `POST /add` — Add Record

```bash
curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"IP": "192.168.1.30", "record": "printer.home.lab"}'
```

| Status | Meaning |
|--------|---------|
| `200` | Record added, DNS restarted |
| `400` | Validation error (invalid IP or domain) |
| `409` | Duplicate record |

### `POST /delete` — Delete Record

```bash
curl -X POST http://localhost:3000/delete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"IP": "192.168.1.30", "record": "printer.home.lab"}'
```

| Status | Meaning |
|--------|---------|
| `200` | Record deleted, DNS restarted |
| `400` | Validation error |
| `404` | Record not found |

### `GET /reset` — Restore from Backup

```bash
curl -H "X-API-Key: YOUR_KEY" http://localhost:3000/reset
```

Restores DNS records from the backup file created during the last add operation.

## Authentication

When `API_KEY` is set in the environment, all endpoints except `/health` require one of:

- **Header:** `X-API-Key: YOUR_KEY`
- **Query param:** `?api_key=YOUR_KEY`

When `API_KEY` is empty or unset, authentication is disabled.

Authentication uses constant-time comparison (`crypto.timingSafeEqual`) to prevent timing attacks.

### Generating an API Key

```bash
openssl rand -hex 32
```

## Client Library

The `client/PiholeDnsClient.js` module provides programmatic access for integration with MCP servers or other tooling.

### Usage

```javascript
const PiholeDnsClient = require('./client/PiholeDnsClient');

const client = new PiholeDnsClient({
  baseUrl: 'http://your-pihole:3000',
  apiKey: 'your-api-key',
});

// List all records
const records = await client.listRecords();

// Add a record
await client.addRecord('192.168.1.50', 'newhost.home.lab');

// Delete a record
await client.deleteRecord('192.168.1.50', 'newhost.home.lab');

// Health check
const status = await client.health();

// Restore from backup
await client.resetRecords();
```

### CLI

```bash
# Set API_KEY and PIHOLE_DNS_API_URL in .env, then:
npm run dns -- list
npm run dns -- add 192.168.1.50 newhost.home.lab
npm run dns -- delete 192.168.1.50 newhost.home.lab
npm run dns -- health
npm run dns -- reset
```

## MCP Server

The `mcp-server/` directory contains an MCP (Model Context Protocol) server that enables Claude Desktop, Claude Code, and other MCP-compatible tools to manage Pi-hole DNS records directly.

### Quick Start

```bash
cd mcp-server
npm install
npm run build
```

### Tools Provided

| Tool | Description |
|------|-------------|
| `pihole_dns_list` | List all local DNS records |
| `pihole_dns_add` | Add a DNS record |
| `pihole_dns_delete` | Delete a DNS record |
| `pihole_dns_reset` | Restore from backup |
| `pihole_dns_health` | Check API server health |

See [`mcp-server/README.md`](mcp-server/README.md) for configuration and setup details.

### Using with mcp-debug proxy

For development and debugging, you can use the [mcp-debug](https://github.com/ExactDoug/mcp-debug) proxy. Create a `config.yaml` in the project root:

```yaml
servers:
  - name: pihole-dns
    prefix: pihole
    transport: stdio
    command: node
    args: ["mcp-server/build/index.js"]
    env:
      PIHOLE_DNS_API_URL: "http://<PIHOLE_IP>:3000"
      API_KEY: "<YOUR_API_KEY>"
    timeout: 30s
```

Then configure `.mcp.json` to point to the proxy. See mcp-debug documentation for details.

## Deployment

### systemd Service

The install script deploys to `/opt/pihole-dns-api/` and sets up a systemd service with:

- Automatic restart on failure (5s delay)
- Starts after `pihole-FTL.service`
- Security hardening: `ProtectSystem=strict`, `ProtectHome=yes`, `PrivateTmp=yes`
- Only `/etc/pihole` is writable
- Logs to journald

### Service Management

```bash
sudo systemctl start pihole-dns-api
sudo systemctl stop pihole-dns-api
sudo systemctl restart pihole-dns-api
sudo systemctl status pihole-dns-api
journalctl -u pihole-dns-api -f    # View logs
```

### Prerequisites

- **Node.js >= 16** (LTS 20.x recommended)
- **Pi-hole v5** installed and running
- **Root access** (required for `/etc/pihole` writes and DNS restart)

## Testing

```bash
npm test
```

Runs unit tests (validators) and integration tests (routes) with coverage.

## Project Structure

```
index.js                  Entry point
app.js                    Express app setup
config.js                 Environment-based configuration
client/
  PiholeDnsClient.js      API client library
  cli.js                  CLI tool
middleware/
  auth.js                 API key authentication
  errorHandler.js         Centralized error handling
  requestLogger.js        Request logging
routes/
  records.js              DNS record CRUD endpoints
  health.js               Health check endpoint
services/
  dnsFile.js              File I/O operations
  pihole.js               Pi-hole restart / availability
validators/
  dns.js                  IP and domain validation
deploy/
  pihole-dns-api.service  systemd unit file
  install.sh              Automated installer
mcp-server/
  src/
    index.ts              MCP server entry point
    tools.ts              Tool registrations (5 tools)
    client.ts             Typed wrapper for PiholeDnsClient
  package.json            ESM package with MCP SDK
  tsconfig.json           TypeScript configuration
  README.md               MCP server documentation
tests/
  validators.test.js      Validator unit tests
  routes.test.js          Endpoint integration tests
```

## License

ISC
