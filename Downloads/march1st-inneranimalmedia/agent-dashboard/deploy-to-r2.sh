#!/usr/bin/env bash
# Build agent-dashboard and upload to R2 (agent-sam bucket). Run from repo root.
# Requires: npm in agent-dashboard, wrangler configured for account with agent-sam bucket.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG="$REPO_ROOT/wrangler.production.toml"

cd "$SCRIPT_DIR"
npm run build

echo "Uploading to R2 (agent-sam) --remote..."
wrangler r2 object put agent-sam/static/dashboard/agent/agent-dashboard.js \
  --file dist/agent-dashboard.js \
  --content-type "application/javascript" \
  --config "$CONFIG" \
  --remote

wrangler r2 object put agent-sam/static/dashboard/agent/agent-dashboard.css \
  --file dist/agent-dashboard.css \
  --content-type "text/css" \
  --config "$CONFIG" \
  --remote

echo "Upload dashboard pages (agent.html, chats.html)"
if [ -f "$REPO_ROOT/dashboard/agent.html" ]; then
  wrangler r2 object put agent-sam/static/dashboard/agent.html \
    --file "$REPO_ROOT/dashboard/agent.html" \
    --content-type "text/html" \
    --config "$CONFIG" \
    --remote
fi
if [ -f "$REPO_ROOT/dashboard/chats.html" ]; then
  wrangler r2 object put agent-sam/static/dashboard/chats.html \
    --file "$REPO_ROOT/dashboard/chats.html" \
    --content-type "text/html" \
    --config "$CONFIG" \
    --remote
fi
echo "Done. Deploy worker from repo root: npm run deploy"
