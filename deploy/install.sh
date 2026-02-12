#!/bin/bash
set -euo pipefail

INSTALL_DIR="/opt/pihole-dns-api"
SERVICE_FILE="/etc/systemd/system/pihole-dns-api.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Pi-hole DNS API Installer ==="
echo

# Check root
if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: This script must be run as root"
  exit 1
fi

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "ERROR: Node.js >= 16 required (found v$(node -v))"
  exit 1
fi

echo "Node.js $(node -v) detected"

# Check Pi-hole
if ! command -v pihole &>/dev/null; then
  echo "WARNING: pihole command not found. Service may not function correctly."
fi

# Install application
echo "Installing to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

# Copy application files
cp "$PROJECT_DIR/index.js" "$INSTALL_DIR/"
cp "$PROJECT_DIR/app.js" "$INSTALL_DIR/"
cp "$PROJECT_DIR/config.js" "$INSTALL_DIR/"
cp "$PROJECT_DIR/package.json" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/middleware" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/routes" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/services" "$INSTALL_DIR/"
cp -r "$PROJECT_DIR/validators" "$INSTALL_DIR/"

# Install production dependencies
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production --silent

# Setup environment file
if [ ! -f "$INSTALL_DIR/.env" ]; then
  cp "$PROJECT_DIR/.env.example" "$INSTALL_DIR/.env"
  echo
  echo "IMPORTANT: Edit $INSTALL_DIR/.env to set your API_KEY"
  echo "  nano $INSTALL_DIR/.env"
  echo
fi

# Install systemd service
echo "Installing systemd service..."
cp "$PROJECT_DIR/deploy/pihole-dns-api.service" "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable pihole-dns-api

echo
echo "=== Installation complete ==="
echo
echo "Next steps:"
echo "  1. Edit $INSTALL_DIR/.env (set API_KEY for security)"
echo "  2. Start the service: systemctl start pihole-dns-api"
echo "  3. Check status: systemctl status pihole-dns-api"
echo "  4. Test: curl http://localhost:3000/health"
echo
