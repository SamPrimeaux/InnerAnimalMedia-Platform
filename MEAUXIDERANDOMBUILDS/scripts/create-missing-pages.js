// Script to create missing pages with glassmorphic footer
const fs = require('fs');
const path = require('path');

const baseTemplate = (title, content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Inner Animal Media</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
    <script src="/shared/header.js"></script>
    <link rel="stylesheet" href="/shared/footer.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(180deg, #0A0E1A 0%, #0F1419 100%);
            color: #F9FAFB;
            line-height: 1.6;
            min-height: 100vh;
            padding-top: 80px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 80px 40px;
        }
        h1 {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 24px;
            letter-spacing: -1.5px;
        }
        h2 {
            font-size: 32px;
            font-weight: 700;
            margin-top: 48px;
            margin-bottom: 16px;
        }
        p {
            font-size: 18px;
            color: rgba(249, 250, 251, 0.7);
            margin-bottom: 16px;
            line-height: 1.7;
        }
        a {
            color: #4A9FFF;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <header role="banner"></header>
    <div class="container">
        ${content}
    </div>
    <div id="footer-container-global"></div>
    <script src="/shared/footer.js"></script>
</body>
</html>
`;

// Create missing pages
const pages = {
    'support.html': {
        title: 'Support',
        content: `
            <h1>Support</h1>
            <p>Get help with Inner Animal Media. We're here to assist you.</p>
            <h2>Contact Support</h2>
            <p>Email: <a href="mailto:support@inneranimalmedia.com">support@inneranimalmedia.com</a></p>
            <p>For urgent issues, please contact us directly.</p>
        `
    },
    'privacy.html': {
        title: 'Privacy Policy',
        content: `
            <h1>Privacy Policy</h1>
            <p>This is a summary. For full details, see <a href="/legal/privacy">our complete privacy policy</a>.</p>
            <p>We respect your privacy and are committed to protecting your personal information.</p>
        `
    }
};

const rootDir = path.join(__dirname, '..');
pages.forEach((page, filename) => {
    const filePath = path.join(rootDir, filename);
    if (!fs.existsSync(filePath)) {
        const html = baseTemplate(page.title, page.content);
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`✓ Created ${filename}`);
    } else {
        console.log(`⚠️  ${filename} already exists`);
    }
});
