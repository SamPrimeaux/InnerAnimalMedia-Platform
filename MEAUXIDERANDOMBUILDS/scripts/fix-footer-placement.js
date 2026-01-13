// Fix footer CSS/JS placement - CSS in head, JS before </body>
const fs = require('fs');
const path = require('path');

const pages = [
    'index.html', 'services.html', 'work.html', 'about.html', 'contact.html',
    'login.html', 'features.html', 'tools.html', 'pricing.html', 'workflows.html',
    'terms.html'
];

function fixFooterPlacement(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${filePath} does not exist`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove footer references from body if they exist
    const bodyFooterPattern = /<!-- Global Footer -->[\s\S]*?<script src="\/shared\/footer\.js"><\/script>/;
    if (content.match(bodyFooterPattern)) {
        content = content.replace(bodyFooterPattern, '');
        modified = true;
    }

    // Add CSS to head if not present
    const headEnd = content.indexOf('</head>');
    if (headEnd > 0) {
        const headPart = content.substring(0, headEnd);
        if (!headPart.includes('footer.css')) {
            const cssLink = '    <link rel="stylesheet" href="/shared/footer.css">';
            content = content.substring(0, headEnd) + '\n' + cssLink + '\n' + content.substring(headEnd);
            modified = true;
        }

        // Add model-viewer script to head if not present
        if (!headPart.includes('model-viewer')) {
            const modelViewer = '    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>';
            content = content.substring(0, headEnd) + '\n' + modelViewer + '\n' + content.substring(headEnd);
            modified = true;
        }
    }

    // Add footer container and script before </body>
    const bodyEnd = content.lastIndexOf('</body>');
    if (bodyEnd > 0) {
        const bodyPart = content.substring(bodyEnd);
        if (!bodyPart.includes('footer-container-global') && !content.substring(0, bodyEnd).includes('footer-container-global')) {
            const footerHTML = `    <div id="footer-container-global"></div>
    <script src="/shared/footer.js"></script>
`;
            content = content.substring(0, bodyEnd) + '\n' + footerHTML + content.substring(bodyEnd);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Fixed footer placement in ${path.basename(filePath)}`);
        return true;
    } else {
        console.log(`✓ ${path.basename(filePath)} already correct`);
        return false;
    }
}

// Process all pages
const rootDir = path.join(__dirname, '..');
console.log('Fixing footer placement...\n');
let fixed = 0;

pages.forEach(page => {
    const filePath = path.join(rootDir, page);
    if (fixFooterPlacement(filePath)) {
        fixed++;
    }
});

console.log(`\n✅ Fixed ${fixed} pages`);
