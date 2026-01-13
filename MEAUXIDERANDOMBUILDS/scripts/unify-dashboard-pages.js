#!/usr/bin/env node

/**
 * Unify Dashboard Pages Script
 * Updates all dashboard pages to use the unified sidebar and layout
 */

const fs = require('fs');
const path = require('path');

const dashboardDir = path.join(__dirname, '../dashboard');
const wrapperTemplate = path.join(__dirname, '../shared/dashboard-wrapper.html');

// Read wrapper template
const wrapperContent = fs.readFileSync(wrapperTemplate, 'utf8');

// Get all HTML files in dashboard directory (excluding index-old.html)
const dashboardFiles = fs.readdirSync(dashboardDir)
  .filter(file => file.endsWith('.html') && file !== 'index-old.html')
  .map(file => path.join(dashboardDir, file));

// Page title mappings
const pageTitles = {
  'index.html': 'Dashboard Overview',
  'projects.html': 'Projects',
  'workflows.html': 'Automation & Workflows',
  'deployments.html': 'Deployments',
  'workers.html': 'Workers',
  'tenants.html': 'Tenants',
  'meauxmcp.html': 'MeauxMCP',
  'meauxsql.html': 'MeauxSQL',
  'meauxcad.html': 'MeauxCAD',
  'meauxide.html': 'MeauxIDE',
  'meauxwork.html': 'InnerWork',
  'tasks.html': 'Tasks',
  'calendar.html': 'Calendar',
  'messages.html': 'Messages',
  'video.html': 'Video Calls',
  'talk.html': 'Talk',
  'analytics.html': 'Analytics',
  'api-gateway.html': 'API Gateway',
  'cloudflare.html': 'Cloudflare',
  'databases.html': 'Databases',
  'library.html': 'Library',
  'brand.html': 'Brand Assets',
  'gallery.html': 'Gallery',
  'prompts.html': 'Prompts',
  'templates.html': 'Templates',
  'settings.html': 'Settings',
  'team.html': 'Team',
  'clients.html': 'Clients',
  'support.html': 'Support',
  'ai-services.html': 'AI Services'
};

function extractPageContent(html) {
  // Try to find main content - look for common patterns
  const patterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*(?:container|content|main|page|dashboard)[^"]*"[\s\S]*?>([\s\S]*?)<\/div>/i,
    /<body[^>]*>([\s\S]*?)<\/body>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      // Remove script tags from content (they'll be handled separately)
      let content = match[1];

      // Extract scripts separately
      const scriptMatches = content.matchAll(/<script[\s\S]*?<\/script>/gi);
      const scripts = Array.from(scriptMatches).map(m => m[0]);
      content = content.replace(/<script[\s\S]*?<\/script>/gi, '');

      // Clean up wrapper divs that might be redundant
      content = content.trim();

      return { content, scripts };
    }
  }

  // Fallback: extract everything between body tags
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    let content = bodyMatch[1];
    const scriptMatches = content.matchAll(/<script[\s\S]*?<\/script>/gi);
    const scripts = Array.from(scriptMatches).map(m => m[0]);
    content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
    return { content: content.trim(), scripts };
  }

  return { content: '', scripts: [] };
}

function extractCustomStyles(html) {
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatch) {
    // Only include styles that aren't standard dashboard styles
    return styleMatch
      .map(s => s.replace(/<\/?style[^>]*>/gi, ''))
      .filter(s => {
        // Exclude common dashboard/base styles
        const excludedPatterns = [
          /^\s*\*\s*\{/,
          /body\s*\{/,
          /:root\s*\{/,
          /\.sidebar/,
          /\.header/,
          /\.dashboard-layout/,
          /custom-scrollbar/
        ];
        return !excludedPatterns.some(pattern => pattern.test(s));
      })
      .join('\n\n');
  }
  return '';
}

function updateDashboardPage(filePath) {
  const fileName = path.basename(filePath);
  const pageTitle = pageTitles[fileName] || fileName.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  console.log(`Updating ${fileName}...`);

  const originalHtml = fs.readFileSync(filePath, 'utf8');
  const { content, scripts } = extractPageContent(originalHtml);
  const customStyles = extractCustomStyles(originalHtml);

  // Build the new HTML
  let newHtml = wrapperContent
    .replace(/\{\{PAGE_TITLE\}\}/g, pageTitle)
    .replace(/\{\{PAGE_CONTENT\}\}/g, content)
    .replace(/\{\{CUSTOM_STYLES\}\}/g, customStyles ? `<style>${customStyles}</style>` : '')
    .replace(/\{\{PAGE_SCRIPTS\}\}/g, scripts.join('\n    '));

  // Write updated file
  fs.writeFileSync(filePath, newHtml, 'utf8');
  console.log(`✅ Updated ${fileName}`);
}

// Process all dashboard files
console.log('🚀 Unifying dashboard pages...\n');

dashboardFiles.forEach(updateDashboardPage);

console.log(`\n✅ Updated ${dashboardFiles.length} dashboard pages!`);
console.log('\n📝 Next steps:');
console.log('   1. Review the updated pages');
console.log('   2. Upload to R2: ./upload-all-to-r2.sh');
console.log('   3. Deploy worker: wrangler deploy --env production');
