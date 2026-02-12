# Pi-hole DNS API - Project Notes

## Architecture

Express.js REST API for managing Pi-hole v5 local DNS records via `/etc/pihole/custom.list`.

- **Entry point:** `index.js` (just starts server)
- **App setup:** `app.js` (middleware chain + routes)
- **Config:** `config.js` (all settings from env vars via dotenv)

## Key Design Decisions

- Synchronous file I/O to avoid race conditions (single small file)
- API field names `{IP, record}` preserved for backward compatibility with upstream fork
- Auth disabled by default (empty `API_KEY`) for backward compatibility
- Health endpoint exempt from auth for monitoring integration
- `pihole restartdns` used instead of `service pihole-FTL restart`

## Testing

```bash
npm test
```

Tests use temp files and `echo` as mock restart command. No Pi-hole required for testing.

## Deployment

Deployed as systemd service on Pi-hole host at `/opt/pihole-dns-api/`.
Install script: `sudo ./deploy/install.sh`

## Client Library

`client/PiholeDnsClient.js` is a zero-dependency client designed for MCP server integration.
