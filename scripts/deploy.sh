#!/bin/sh
set -e

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-/config/www/sma-webbox-dashboard}"

echo "Deploying SMA Webbox Dashboard"
echo "  from: $SRC"
echo "  to:   $DEST"

mkdir -p "$DEST"
cp -r "$SRC/index.html" "$SRC/css" "$SRC/js" "$DEST/"

echo "Done. Open: http://<ha-host>:8123/local/sma-webbox-dashboard/index.html"