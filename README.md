# Pi-hole DNS API

REST API for managing Pi-hole v5 local DNS records. Designed for integration with MCP servers, automation tools, and direct HTTP clients.

## Features

- CRUD operations for local DNS records (`/etc/pihole/custom.list`)
- API key authentication (optional, constant-time comparison)
- Input validation (IPv4, IPv6, domain names)
- Health check endpoint for monitoring
- Backup/restore support
- Configurable via environment variables
- systemd deployment with security hardening

## Quick Start

### Development

```bash
git clone https://github.com/ExactDoug/pihole-dns-api.git
cd pihole-dns-api
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

### Production (on Pi-hole host)

```bash
sudo ./deploy/install.sh
sudo nano /opt/pihole-dns-api/.env  # Set API_KEY
sudo systemctl start pihole-dns-api
```

## Configuration

All settings via environment variables (or `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP listen port |
| `DNS_FILE_PATH` | `/etc/pihole/custom.list` | Pi-hole DNS records file |
| `DNS_FILE_BACKUP_PATH` | `/etc/pihole/custom.list.old` | Backup file path |
| `PIHOLE_RESTART_CMD` | `pihole restartdns` | Command to reload DNS |
| `API_KEY` | _(empty)_ | API key (empty = auth disabled) |

## API Endpoints

### Health Check

```bash
# No authentication required
curl http://localhost:3000/health
```

Returns `200 OK` or `503 Service Unavailable`:

```json
{
  "status": "ok",
  "timestamp": "2026-02-12T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "dnsFile": { "status": "ok", "path": "/etc/pihole/custom.list", "recordCount": 5 },
    "pihole": { "status": "ok" }
  }
}
```

### List Records

```bash
curl -H "X-API-Key: your-key" http://localhost:3000/
```

Response:
```json
[
  { "IP": "192.168.1.10", "record": "server.home.lab" },
  { "IP": "192.168.1.20", "record": "nas.home.lab" }
]
```

### Add Record

```bash
curl -X POST http://localhost:3000/add \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"IP": "192.168.1.30", "record": "printer.home.lab"}'
```

Responses: `200` success, `400` validation error, `409` duplicate.

### Delete Record

```bash
curl -X POST http://localhost:3000/delete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{"IP": "192.168.1.30", "record": "printer.home.lab"}'
```

Responses: `200` success, `400` validation error, `404` not found.

### Reset (Restore Backup)

```bash
curl -H "X-API-Key: your-key" http://localhost:3000/reset
```

Restores DNS records from the backup file created during the last add operation.

## Authentication

When `API_KEY` is set, all endpoints except `/health` require authentication via:

- **Header**: `X-API-Key: your-key`
- **Query param**: `?api_key=your-key`

When `API_KEY` is empty or unset, authentication is disabled.

## Deployment

### systemd Service

The install script sets up a systemd service with:
- Automatic restart on failure
- Starts after Pi-hole FTL
- Security hardening (`ProtectSystem=strict`, `ProtectHome=yes`)
- Logs to journald (`journalctl -u pihole-dns-api -f`)

### Manual Service Management

```bash
sudo systemctl start pihole-dns-api
sudo systemctl stop pihole-dns-api
sudo systemctl restart pihole-dns-api
sudo systemctl status pihole-dns-api
journalctl -u pihole-dns-api -f  # View logs
```

## Testing

```bash
npm test
```

## License

ISC
