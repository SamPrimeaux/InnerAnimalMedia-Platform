#!/usr/bin/env node
/**
 * Script to add layout-loader, theme system, and onboarding to all dashboard pages
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, '../dashboard');
const THEME_BASE = '<link rel="stylesheet" href="/shared/themes/base.css">';
const THEME_BRAND = '<link rel="stylesheet" href="/shared/themes/inneranimal-media.css">';
const LAYOUT_LOADER = '<script src="/shared/layout-loader.js"></script>';
const ONBOARDING_WIZARD = '<script src="/shared/onboarding-wizard.js"></script>';

function updateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already updated
    if (content.includes('layout-loader.js')) {
        console.log(`  ✓ Already updated: ${path.basename(filePath)}`);
        return false;
    }
    
    let updated = content;
    
    // Add theme CSS before closing </head> tag
    if (!content.includes('themes/base.css')) {
        updated = updated.replace(/(<\/head>)/i, `    ${THEME_BASE}\n    ${THEME_BRAND}\n$1`);
    }
    
    // Add layout loader and onboarding before closing </body> tag
    if (!content.includes('layout-loader.js')) {
        updated = updated.replace(/(<\/body>)/i, `    ${LAYOUT_LOADER}\n    ${ONBOARDING_WIZARD}\n$1`);
    }
    
    fs.writeFileSync(filePath, updated, 'utf8');
    return true;
}

// Process all HTML files in dashboard directory
const files = fs.readdirSync(DASHBOARD_DIR)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(DASHBOARD_DIR, file));

console.log(`Updating ${files.length} dashboard pages...\n`);

let updated = 0;
files.forEach(file => {
    try {
        if (updateFile(file)) {
            console.log(`  ✓ Updated: ${path.basename(file)}`);
            updated++;
        }
    } catch (error) {
        console.error(`  ✗ Error updating ${path.basename(file)}:`, error.message);
    }
});

console.log(`\n✓ Updated ${updated} files`);
console.log(`✓ ${files.length - updated} files were already up to date`);
