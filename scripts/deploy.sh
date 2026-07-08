#!/bin/sh
set -e

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-/config/www/community/sma-webbox-dashboard}"

echo "Deploying SMA Webbox Dashboard"
echo "  from: $SRC/dist"
echo "  to:   $DEST"

mkdir -p "$DEST"
cp -r "$SRC/dist/." "$DEST/"

echo "Done. Open: http://<ha-host>:8123/local/community/sma-webbox-dashboard/index.html"