#!/bin/bash
# Script to add header/footer, theme system, and onboarding to all dashboard pages

DASHBOARD_DIR="/Users/samprimeaux/MEAUXIDERANDOMBUILDS/dashboard"
SCRIPT_DIR="/Users/samprimeaux/MEAUXIDERANDOMBUILDS/shared"

# Theme CSS and scripts to inject
THEME_BASE="<link rel=\"stylesheet\" href=\"/shared/themes/base.css\">"
THEME_BRAND="<link rel=\"stylesheet\" href=\"/shared/themes/inneranimal-media.css\">"
LAYOUT_LOADER="<script src=\"/shared/layout-loader.js\"></script>"
ONBOARDING_WIZARD="<script src=\"/shared/onboarding-wizard.js\"></script>"

echo "Updating all dashboard pages with theme system and components..."

for file in "$DASHBOARD_DIR"/*.html; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "Processing: $filename"
        
        # Check if file already has theme system (skip if present)
        if grep -q "layout-loader.js" "$file"; then
            echo "  Already updated, skipping..."
            continue
        fi
        
        # Add theme CSS before closing </head>
        sed -i '' '/<\/head>/i\
    '"$THEME_BASE"'
    '"$THEME_BRAND"'
' "$file"
        
        # Add layout loader and onboarding before closing </body>
        sed -i '' '/<\/body>/i\
    '"$LAYOUT_LOADER"'
    '"$ONBOARDING_WIZARD"'
' "$file"
        
        echo "  ✓ Updated $filename"
    fi
done

echo "Done! All dashboard pages updated."
