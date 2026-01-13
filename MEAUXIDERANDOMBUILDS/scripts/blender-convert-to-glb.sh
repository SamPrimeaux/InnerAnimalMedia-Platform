#!/bin/bash
# Convert Blender .blend file to GLB format
# Usage: ./scripts/blender-convert-to-glb.sh input.blend output.glb

set -e

BLENDER_PATH="/Applications/Blender.app/Contents/MacOS/Blender"
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/blender-export-glb.py"

if [ ! -f "$BLENDER_PATH" ]; then
    echo "❌ Blender not found at $BLENDER_PATH"
    exit 1
fi

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <input.blend> <output.glb>"
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="$2"

if [ ! -f "$INPUT_FILE" ]; then
    echo "❌ Input file not found: $INPUT_FILE"
    exit 1
fi

echo "🔄 Converting $INPUT_FILE to $OUTPUT_FILE..."

"$BLENDER_PATH" --background --python "$SCRIPT_PATH" -- "$INPUT_FILE" "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Conversion complete: $OUTPUT_FILE"
else
    echo "❌ Conversion failed"
    exit 1
fi
