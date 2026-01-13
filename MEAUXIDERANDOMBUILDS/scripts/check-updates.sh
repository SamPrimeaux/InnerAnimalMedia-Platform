#!/bin/bash
# Auto-sync update checker - Checks for package/dependency updates
# Usage: ./scripts/check-updates.sh

set -e

echo "🔄 Checking for updates..."

# Check Node.js packages (if package.json exists)
if [ -f "package.json" ]; then
    echo ""
    echo "📦 Node.js packages:"
    npm outdated 2>/dev/null || echo "   ✅ All packages up to date"
fi

# Check Cloudflare Workers dependencies
echo ""
echo "☁️  Cloudflare Workers:"
WRANGLER_VERSION=$(wrangler --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
echo "   Wrangler: $WRANGLER_VERSION"

# Check Blender version
if command -v blender &> /dev/null; then
    echo ""
    echo "🎨 Blender:"
    BLENDER_VERSION=$(blender --version 2>&1 | head -1)
    echo "   $BLENDER_VERSION"
fi

# Check Python packages (if requirements.txt exists)
if [ -f "requirements.txt" ]; then
    echo ""
    echo "🐍 Python packages:"
    pip list --outdated 2>/dev/null || echo "   ✅ All packages up to date"
fi

echo ""
echo "✅ Update check complete!"
