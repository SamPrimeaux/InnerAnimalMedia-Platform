// Script to add glassmorphic footer to all HTML pages
const fs = require('fs');
const path = require('path');

const pages = [
    'index.html',
    'services.html',
    'work.html',
    'about.html',
    'contact.html',
    'login.html',
    'features.html',
    'tools.html',
    'pricing.html',
    'support.html',
    'workflows.html',
    'api.html',
    'docs.html',
    'security.html',
    'terms.html',
    'privacy.html'
];

const footerHTML = `
    <!-- Global Footer -->
    <link rel="stylesheet" href="/shared/footer.css">
    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
    <div id="footer-container-global"></div>
    <script src="/shared/footer.js"></script>
`;

function addFooterToPage(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filePath} does not exist - skipping`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if footer already exists
    if (content.includes('footer-container-global') || content.includes('footer.js')) {
        console.log(`✓ ${filePath} already has footer`);
        return false;
    }

    // Find </body> tag and insert footer before it
    if (content.includes('</body>')) {
        content = content.replace('</body>', `${footerHTML}\n</body>`);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Added footer to ${filePath}`);
        return true;
    } else {
        console.log(`⚠️  ${filePath} has no </body> tag - skipping`);
        return false;
    }
}

// Process all pages
console.log('Adding footer to pages...\n');
const rootDir = path.join(__dirname, '..');
let added = 0;

pages.forEach(page => {
    const filePath = path.join(rootDir, page);
    if (addFooterToPage(filePath)) {
        added++;
    }
});

console.log(`\n✅ Added footer to ${added} pages`);
