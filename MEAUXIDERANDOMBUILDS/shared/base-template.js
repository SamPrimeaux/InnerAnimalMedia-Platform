// Base Template Generator for Multi-Page Application
// This function generates the full HTML structure for each page

function generatePageTemplate(options = {}) {
    const {
        title = 'InnerAnimal Media | Executive OS',
        pageName = 'overview',
        pageTitle = 'Dashboard',
        content = '',
        scripts = '',
        styles = ''
    } = options;

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    },
                    colors: {
                        brand: {
                            orange: '#ff6b00',
                            red: '#dc2626',
                            dark: '#050507',
                            panel: '#0a0a0f',
                            surface: '#171717'
                        }
                    }
                }
            }
        }
    </script>

    <!-- Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        body {
            background-color: #050507;
            color: #f4f4f5;
            overflow: hidden;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff6b00; }

        .glass-panel {
            background: rgba(23, 23, 23, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { 
            from { opacity: 0; transform: translateY(10px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .status-dot { 
            width: 8px; 
            height: 8px; 
            border-radius: 50%; 
            box-shadow: 0 0 10px currentColor; 
        }

        .grid-bg { 
            background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); 
            background-size: 40px 40px; 
        }
        ${styles}
    </style>
</head>
<body class="flex h-screen selection:bg-orange-500/30">
    <!-- Sidebar will be loaded here -->
    <div id="sidebar-container"></div>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col h-full overflow-hidden bg-brand-dark relative">
        <!-- Header will be loaded here -->
        <div id="header-container"></div>

        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-10 custom-scrollbar relative" data-page="${pageName}">
            ${content}
        </div>
    </main>

    <!-- Agent Sam Terminal (optional) -->
    <div id="agent-sam-container"></div>

    <!-- Shared Layout Script -->
    <script src="/shared/layout.js"></script>
    
    <!-- Page-specific scripts -->
    <script>
        // Load sidebar and header
        async function loadComponents() {
            // Load sidebar
            const sidebarRes = await fetch('/shared/sidebar.html');
            const sidebarHtml = await sidebarRes.text();
            document.getElementById('sidebar-container').innerHTML = sidebarHtml;
            
            // Load header
            const headerRes = await fetch('/shared/header.html');
            const headerHtml = await headerRes.text();
            document.getElementById('header-container').innerHTML = headerHtml;
            
            // Update page title
            document.getElementById('page-title').textContent = '${pageTitle}';
            
            // Initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            // Highlight active nav
            if (typeof highlightActiveNav === 'function') {
                highlightActiveNav();
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            loadComponents();
            ${scripts}
        });
    </script>
</body>
</html>`;
}

// Export for use in build scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generatePageTemplate };
}
