#!/usr/bin/env node
/**
 * Auto-sync update checker
 * Checks for updates and sends notifications
 */

const https = require('https');
const { execSync } = require('child_process');

const CHECK_INTERVAL = 1000 * 60 * 60 * 24; // 24 hours

async function checkUpdates() {
    console.log('🔄 Checking for updates...');

    const updates = {
        npm: [],
        cloudflare: null,
        blender: null,
        errors: []
    };

    try {
        // Check npm packages
        if (require('fs').existsSync('package.json')) {
            try {
                const outdated = execSync('npm outdated --json', { encoding: 'utf8', stdio: 'pipe' });
                const parsed = JSON.parse(outdated);
                if (Object.keys(parsed).length > 0) {
                    updates.npm = Object.keys(parsed).map(pkg => ({
                        name: pkg,
                        current: parsed[pkg].current,
                        wanted: parsed[pkg].wanted,
                        latest: parsed[pkg].latest
                    }));
                }
            } catch (e) {
                // No updates or error
            }
        }

        // Check Wrangler version
        try {
            const wranglerVersion = execSync('wrangler --version', { encoding: 'utf8' }).trim();
            updates.cloudflare = wranglerVersion;
        } catch (e) {
            updates.errors.push('Wrangler check failed');
        }

        // Check Blender version
        try {
            const blenderVersion = execSync('blender --version 2>&1 | head -1', { encoding: 'utf8', shell: '/bin/bash' }).trim();
            updates.blender = blenderVersion;
        } catch (e) {
            // Blender not found or error
        }

    } catch (error) {
        console.error('Error checking updates:', error);
        updates.errors.push(error.message);
    }

    return updates;
}

async function reportUpdates(updates) {
    console.log('\n📊 Update Report:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (updates.npm.length > 0) {
        console.log(`\n📦 NPM Packages (${updates.npm.length} outdated):`);
        updates.npm.forEach(pkg => {
            console.log(`   ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
        });
        console.log('\n   Run: npm update');
    } else {
        console.log('\n📦 NPM Packages: ✅ All up to date');
    }

    if (updates.cloudflare) {
        console.log(`\n☁️  Cloudflare: ${updates.cloudflare}`);
    }

    if (updates.blender) {
        console.log(`\n🎨 Blender: ${updates.blender}`);
    }

    if (updates.errors.length > 0) {
        console.log(`\n⚠️  Errors: ${updates.errors.join(', ')}`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run check
(async () => {
    const updates = await checkUpdates();
    await reportUpdates(updates);

    if (updates.npm.length > 0 || updates.errors.length > 0) {
        process.exit(1); // Exit with error if updates needed
    }
})();
