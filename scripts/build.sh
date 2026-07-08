#!/bin/sh
# Sync dashboard assets into dist/ (preserves dist/sma-webbox-dashboard.js)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/dist"

mkdir -p "$DEST/css" "$DEST/js"
cp "$ROOT/dist/index.html" "$DEST/" 2>/dev/null || true

# If editing from a src/ folder in the future, copy from there instead.
for f in index.html; do
  [ -f "$ROOT/$f" ] && cp "$ROOT/$f" "$DEST/$f"
done
[ -d "$ROOT/css" ] && cp -r "$ROOT/css/." "$DEST/css/"
[ -d "$ROOT/js" ] && cp "$ROOT/js/"*.js "$DEST/js/" 2>/dev/null || true

echo "Built dist/ for HACS"