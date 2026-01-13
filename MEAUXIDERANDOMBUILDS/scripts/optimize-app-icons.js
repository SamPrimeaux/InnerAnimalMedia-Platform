#!/usr/bin/env node

/**
 * Optimize App Icons Script
 * Ensures the official app icon is properly displayed with optimal settings
 */

const fs = require('fs');
const path = require('path');

// Official app icon configuration
const APP_ICON_ID = '17535395-1501-490a-ff3d-e43d7c16a000';
const CLOUDFLARE_IMAGES_HASH = 'g7wf09fCONpnidkRnR_5vw';
const BASE_URL = `https://imagedelivery.net/${CLOUDFLARE_IMAGES_HASH}/${APP_ICON_ID}`;

// Optimized icon URLs for different use cases
const ICON_URLS = {
  // Sidebar/Logo (optimized avatar size)
  sidebar: `${BASE_URL}/avatar?w=48&h=48&fit=cover&format=webp&quality=90`,

  // Favicons
  favicon16: `${BASE_URL}/public?w=16&h=16&fit=cover&format=png`,
  favicon32: `${BASE_URL}/public?w=32&h=32&fit=cover&format=png`,
  favicon180: `${BASE_URL}/public?w=180&h=180&fit=cover&format=png`,
  favicon192: `${BASE_URL}/public?w=192&h=192&fit=cover&format=png`,
  favicon512: `${BASE_URL}/public?w=512&h=512&fit=cover&format=png`,

  // Apple touch icons
  appleTouchIcon: `${BASE_URL}/public?w=180&h=180&fit=cover&format=png`,

  // Email/Share images (larger, high quality)
  share: `${BASE_URL}/public?w=1200&h=630&fit=cover&format=webp&quality=95`,

  // Default/fallback
  default: `${BASE_URL}/avatar?w=64&h=64&fit=cover&format=webp&quality=90`
};

// Generate favicon HTML
function generateFaviconHTML() {
  return `
    <!-- App Icons & Favicons -->
    <link rel="icon" type="image/png" sizes="16x16" href="${ICON_URLS.favicon16}">
    <link rel="icon" type="image/png" sizes="32x32" href="${ICON_URLS.favicon32}">
    <link rel="icon" type="image/png" sizes="180x180" href="${ICON_URLS.favicon180}">
    <link rel="apple-touch-icon" sizes="180x180" href="${ICON_URLS.appleTouchIcon}">
    <link rel="icon" type="image/png" sizes="192x192" href="${ICON_URLS.favicon192}">
    <link rel="icon" type="image/png" sizes="512x512" href="${ICON_URLS.favicon512}">
    <meta name="theme-color" content="#050507">
    <meta name="msapplication-TileImage" content="${ICON_URLS.favicon192}">
    <meta name="msapplication-TileColor" content="#050507">
    
    <!-- Open Graph / Social Sharing -->
    <meta property="og:image" content="${ICON_URLS.share}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta name="twitter:image" content="${ICON_URLS.share}">
    <meta name="twitter:card" content="summary_large_image">
`;
}

// Update dashboard wrapper to include favicons
function updateDashboardWrapper() {
  const wrapperPath = path.join(__dirname, '../shared/dashboard-wrapper.html');
  let content = fs.readFileSync(wrapperPath, 'utf8');

  // Check if favicons already exist
  if (content.includes('rel="icon"') || content.includes('favicon')) {
    console.log('⚠️  Dashboard wrapper already has favicon links, skipping...');
    return;
  }

  // Insert favicons after charset/viewport but before title
  const faviconHTML = generateFaviconHTML();
  content = content.replace(
    /(<meta name="viewport"[^>]*>)/,
    `$1${faviconHTML}`
  );

  fs.writeFileSync(wrapperPath, content, 'utf8');
  console.log('✅ Updated dashboard-wrapper.html with favicons');
}

// Update sidebar to use optimized icon
function updateSidebar() {
  const sidebarPath = path.join(__dirname, '../shared/sidebar.html');
  let content = fs.readFileSync(sidebarPath, 'utf8');

  // Update sidebar logo to use optimized URL
  const oldPattern = /https:\/\/imagedelivery\.net\/[^"'\s]+\/17535395-1501-490a-ff3d-e43d7c16a000\/avatar/g;
  const newIconUrl = ICON_URLS.sidebar;

  if (content.match(oldPattern)) {
    content = content.replace(oldPattern, newIconUrl);
    fs.writeFileSync(sidebarPath, content, 'utf8');
    console.log('✅ Updated sidebar.html with optimized icon');
  } else {
    console.log('⚠️  Sidebar icon URL not found in expected format');
  }
}

// Update main index.html
function updateMainIndex() {
  const indexPath = path.join(__dirname, '../index.html');
  let content = fs.readFileSync(indexPath, 'utf8');

  // Check if favicons exist
  if (content.includes('rel="icon"') || content.includes('favicon')) {
    console.log('⚠️  index.html already has favicon links');
  } else {
    // Insert favicons after viewport meta
    const faviconHTML = generateFaviconHTML();
    content = content.replace(
      /(<meta name="viewport"[^>]*>)/,
      `$1${faviconHTML}`
    );
    fs.writeFileSync(indexPath, content, 'utf8');
    console.log('✅ Updated index.html with favicons');
  }
}

// Update all dashboard pages (they use the wrapper, so this might not be needed)
function updateDashboardPages() {
  const dashboardDir = path.join(__dirname, '../dashboard');
  const files = fs.readdirSync(dashboardDir)
    .filter(file => file.endsWith('.html') && file !== 'index-old.html');

  console.log(`📄 Found ${files.length} dashboard pages (using unified wrapper, no direct updates needed)`);
}

// Main execution
console.log('🎨 Optimizing app icons...\n');
console.log('Icon Configuration:');
console.log(`  Sidebar: ${ICON_URLS.sidebar}`);
console.log(`  Favicon: ${ICON_URLS.favicon32}`);
console.log(`  Share: ${ICON_URLS.share}\n`);

updateDashboardWrapper();
updateSidebar();
updateMainIndex();
updateDashboardPages();

console.log('\n✅ Icon optimization complete!');
console.log('\n📝 Next steps:');
console.log('   1. Upload updated files to R2');
console.log('   2. Deploy worker');
