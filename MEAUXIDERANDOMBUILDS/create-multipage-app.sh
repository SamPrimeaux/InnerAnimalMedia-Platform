#!/bin/bash
# Extract sections from index.html and create separate pages

echo "🔨 Building multi-page application..."

# Read the full index.html
INDEX_CONTENT=$(cat index.html)

# Extract head section (everything before <body>)
HEAD_SECTION=$(echo "$INDEX_CONTENT" | sed -n '/<head>/,/<\/head>/p')

# Extract navigation (we'll reuse this)
NAV_SECTION=$(echo "$INDEX_CONTENT" | sed -n '/<!-- Navigation/,/<\/nav>/p')

# Extract footer
FOOTER_SECTION=$(echo "$INDEX_CONTENT" | sed -n '/<!-- Footer/,/<\/footer>/p')

# Extract scripts
SCRIPT_SECTION=$(echo "$INDEX_CONTENT" | sed -n '/<script>/,/<\/script>/p' | tail -n +2)

echo "✅ Extracted sections"
echo "📄 Creating separate pages..."

# This is a placeholder - I'll create the pages directly in the next step
echo "Done! Pages will be created..."
