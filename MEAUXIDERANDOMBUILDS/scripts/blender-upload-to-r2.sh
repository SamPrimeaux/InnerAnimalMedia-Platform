#!/bin/bash
# Convert Blender .blend to GLB and upload to R2
# Usage: ./scripts/blender-upload-to-r2.sh input.blend r2-path.glb

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONVERT_SCRIPT="$SCRIPT_DIR/blender-convert-to-glb.sh"

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <input.blend> <r2-path>"
    echo "Example: $0 scene.blend static/models/earth.glb"
    exit 1
fi

INPUT_FILE="$1"
R2_PATH="$2"

# Create temp GLB file
TEMP_DIR=$(mktemp -d)
TEMP_GLB="$TEMP_DIR/$(basename "$INPUT_FILE" .blend).glb"

echo "🔄 Step 1: Converting to GLB..."
"$CONVERT_SCRIPT" "$INPUT_FILE" "$TEMP_GLB"

echo "🔄 Step 2: Uploading to R2..."
wrangler r2 object put "inneranimalmedia-assets/$R2_PATH" \
    --file="$TEMP_GLB" \
    --content-type="model/gltf-binary" \
    --remote

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ Upload complete: $R2_PATH"
