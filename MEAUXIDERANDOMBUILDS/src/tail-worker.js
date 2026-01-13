/**
 * Cloudflare Tail Worker
 * Receives execution logs from producer workers for observability
 * Also serves the galaxy-themed Tail Viewer UI
 */

// Galaxy-themed Tail Viewer HTML (embedded)
const GALAXY_UI_HTML = `<!DOCTYPE html>
<html lang="en" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tail Worker | InnerAnimal Media OS</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet">

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

    <!-- Custom Galaxy Styles -->
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #050507;
            color: rgba(255, 255, 255, 0.95);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Galaxy Background Animation */
        .galaxy-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
            z-index: 0;
            overflow: hidden;
        }

        .stars {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9ImEiIGN4PSIwJSIgY3k9IjAlIiByPSI1MCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZmYiIHN0b3Atb3BhY2l0eT0iMSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmZiIgc3RvcC1vcGFjaXR5PSIwIi8+PC9yYWRpYWxHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxLjUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=') repeat;
            background-size: 200px 200px;
            animation: sparkle 20s linear infinite;
        }

        @keyframes sparkle {
            0% { transform: translateY(0); }
            100% { transform: translateY(-200px); }
        }

        /* Nebula Effect */
        .nebula {
            position: absolute;
            width: 100%;
            height: 100%;
            background: 
                radial-gradient(circle at 20% 50%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 20, 147, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 40% 20%, rgba(75, 0, 130, 0.1) 0%, transparent 50%);
            animation: nebulaPulse 15s ease-in-out infinite;
            z-index: 1;
        }

        @keyframes nebulaPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
        }

        /* Glow Effects */
        .glow-text {
            text-shadow: 
                0 0 10px rgba(255, 107, 0, 0.5),
                0 0 20px rgba(255, 107, 0, 0.3),
                0 0 30px rgba(255, 107, 0, 0.2);
        }

        .glow-border {
            box-shadow: 
                0 0 20px rgba(138, 43, 226, 0.3),
                0 0 40px rgba(255, 20, 147, 0.2),
                inset 0 0 20px rgba(138, 43, 226, 0.1);
        }

        /* Log Viewer */
        .log-viewer {
            background: rgba(10, 10, 15, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(138, 43, 226, 0.3);
            border-radius: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            line-height: 1.6;
        }

        .log-entry {
            padding: 8px 16px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.2s ease;
        }

        .log-entry:hover {
            background: rgba(138, 43, 226, 0.1);
        }

        .log-entry.info {
            color: #60a5fa;
            border-left: 3px solid #60a5fa;
        }

        .log-entry.warn {
            color: #fbbf24;
            border-left: 3px solid #fbbf24;
        }

        .log-entry.error {
            color: #f87171;
            border-left: 3px solid #f87171;
        }

        .log-entry.debug {
            color: #a78bfa;
            border-left: 3px solid #a78bfa;
        }

        .log-timestamp {
            color: rgba(255, 255, 255, 0.4);
            margin-right: 12px;
        }

        /* Status Indicator */
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
            animation: pulse 2s ease-in-out infinite;
        }

        .status-dot.connected {
            background: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        .status-dot.disconnected {
            background: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* Scrollbar Styling */
        .log-viewer::-webkit-scrollbar {
            width: 8px;
        }

        .log-viewer::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }

        .log-viewer::-webkit-scrollbar-thumb {
            background: rgba(138, 43, 226, 0.5);
            border-radius: 4px;
        }

        .log-viewer::-webkit-scrollbar-thumb:hover {
            background: rgba(138, 43, 226, 0.7);
        }

        /* Container */
        .container {
            position: relative;
            z-index: 10;
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: rgba(5, 5, 7, 0.5);
        }
    </style>
</head>

<body>
    <!-- Galaxy Background -->
    <div class="galaxy-bg">
        <div class="stars"></div>
        <div class="nebula"></div>
    </div>

    <!-- Main Container -->
    <div class="container">
        <!-- Header -->
        <header class="h-20 border-b border-purple-500/20 bg-brand-panel/80 backdrop-blur-md flex items-center justify-between px-8 z-30 glow-border">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-3">
                    <i data-lucide="activity" class="w-6 h-6 text-purple-400"></i>
                    <h1 class="text-2xl font-bold glow-text text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                        Tail Worker - Galaxy Viewer
                    </h1>
                </div>
                <div class="flex items-center gap-3 ml-6">
                    <span class="status-dot connected" id="connection-status"></span>
                    <span class="text-sm text-zinc-400" id="connection-text">Active</span>
                </div>
            </div>
            <div class="flex items-center gap-4">
                <button onclick="clearLogs()" class="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium transition-all text-purple-300">
                    <i data-lucide="trash-2" class="w-4 h-4"></i> Clear
                </button>
                <a href="/dashboard/tail.html" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-sm font-bold transition-all text-white shadow-lg shadow-purple-500/50">
                    <i data-lucide="external-link" class="w-4 h-4"></i> Full Dashboard
                </a>
            </div>
        </header>

        <!-- Main Content -->
        <div class="flex-1 overflow-hidden p-8">
            <div class="h-full flex flex-col gap-6">
                <!-- Stats Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-brand-surface/80 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 glow-border">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-zinc-400 uppercase tracking-wider">Total Logs</span>
                            <i data-lucide="file-text" class="w-4 h-4 text-purple-400"></i>
                        </div>
                        <div class="text-2xl font-bold text-white" id="total-logs">0</div>
                    </div>
                    <div class="bg-brand-surface/80 backdrop-blur-md border border-pink-500/20 rounded-xl p-4 glow-border">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-zinc-400 uppercase tracking-wider">Info</span>
                            <i data-lucide="info" class="w-4 h-4 text-blue-400"></i>
                        </div>
                        <div class="text-2xl font-bold text-blue-400" id="info-logs">0</div>
                    </div>
                    <div class="bg-brand-surface/80 backdrop-blur-md border border-yellow-500/20 rounded-xl p-4 glow-border">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-zinc-400 uppercase tracking-wider">Warnings</span>
                            <i data-lucide="alert-triangle" class="w-4 h-4 text-yellow-400"></i>
                        </div>
                        <div class="text-2xl font-bold text-yellow-400" id="warn-logs">0</div>
                    </div>
                    <div class="bg-brand-surface/80 backdrop-blur-md border border-red-500/20 rounded-xl p-4 glow-border">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-zinc-400 uppercase tracking-wider">Errors</span>
                            <i data-lucide="x-circle" class="w-4 h-4 text-red-400"></i>
                        </div>
                        <div class="text-2xl font-bold text-red-400" id="error-logs">0</div>
                    </div>
                </div>

                <!-- Log Viewer -->
                <div class="flex-1 min-h-0">
                    <div class="log-viewer h-full overflow-y-auto" id="log-viewer">
                        <div class="text-center py-12 text-zinc-500">
                            <i data-lucide="activity" class="w-12 h-12 mx-auto mb-4 text-purple-400/50"></i>
                            <p class="text-lg mb-2">🌌 Galaxy Tail Worker Viewer</p>
                            <p class="text-sm">This worker receives execution logs from other workers</p>
                            <p class="text-xs mt-4 text-zinc-600">Connected to: inneranimalmedia-dev</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Log storage
        let logCounts = { total: 0, info: 0, warn: 0, error: 0, debug: 0 };
        const logs = [];

        function updateStats() {
            document.getElementById('total-logs').textContent = logCounts.total;
            document.getElementById('info-logs').textContent = logCounts.info;
            document.getElementById('warn-logs').textContent = logCounts.warn;
            document.getElementById('error-logs').textContent = logCounts.error;
        }

        function addLogEntry(entry) {
            const viewer = document.getElementById('log-viewer');
            
            // Remove empty state if present
            if (viewer.children.length === 1 && viewer.children[0].classList.contains('text-center')) {
                viewer.innerHTML = '';
            }

            const logDiv = document.createElement('div');
            logDiv.className = \`log-entry \${entry.level || 'info'}\`;
            
            const timestamp = new Date(entry.timestamp || Date.now()).toLocaleTimeString();
            const message = entry.message || JSON.stringify(entry);
            
            logDiv.innerHTML = \`
                <span class="log-timestamp">\${timestamp}</span>
                <span class="font-bold text-\${entry.level === 'warn' ? 'yellow' : entry.level === 'error' ? 'red' : entry.level === 'debug' ? 'purple' : 'blue'}-400">[\${(entry.level || 'info').toUpperCase()}]</span>
                <span class="ml-2">\${message}</span>
            \`;

            viewer.appendChild(logDiv);
            viewer.scrollTop = viewer.scrollHeight;

            logCounts.total++;
            logCounts[entry.level || 'info']++;
            updateStats();

            // Limit to 1000 logs
            if (logCounts.total > 1000) {
                viewer.removeChild(viewer.firstChild);
            }
        }

        function clearLogs() {
            const viewer = document.getElementById('log-viewer');
            viewer.innerHTML = '<div class="text-center py-12 text-zinc-500"><i data-lucide="activity" class="w-12 h-12 mx-auto mb-4 text-purple-400/50"></i><p>Logs cleared</p></div>';
            logCounts = { total: 0, info: 0, warn: 0, error: 0, debug: 0 };
            updateStats();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Simulate some initial logs for demo
        setTimeout(() => {
            addLogEntry({
                level: 'info',
                message: 'Tail Worker initialized - ready to receive logs',
                timestamp: new Date().toISOString()
            });
            addLogEntry({
                level: 'info',
                message: 'Connected to: inneranimalmedia-dev',
                timestamp: new Date().toISOString()
            });
        }, 500);
    </script>
</body>

</html>`;

export default {
  // Serve galaxy UI for HTTP GET requests
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Serve the galaxy UI
    if (request.method === 'GET') {
      return new Response(GALAXY_UI_HTML, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  },

  // Receive tail events from producer workers
  async tail(events, env) {
    try {
      // Process events from producer workers
      for (const event of events) {
        // Log event metadata
        console.log('Tail event:', {
          scriptName: event.scriptName,
          outcome: event.outcome,
          exception: event.exception,
          logs: event.logs,
          eventTimestamp: event.eventTimestamp,
        });

        // You can:
        // 1. Send to analytics endpoint
        // 2. Store in database
        // 3. Send alerts
        // 4. Aggregate metrics

        // Example: Send to Analytics Engine if available
        if (env['INNERANIMALMEDIA-ANALYTICENGINE']) {
          env['INNERANIMALMEDIA-ANALYTICENGINE'].writeDataPoint({
            index: {
              event_type: 'tail_log',
              script_name: event.scriptName || 'unknown',
            },
            blobs: [JSON.stringify({
              scriptName: event.scriptName,
              outcome: event.outcome,
              exception: event.exception,
              eventTimestamp: event.eventTimestamp,
              logs: event.logs,
            })],
          });
        }
      }
    } catch (error) {
      console.error('Tail worker error:', error);
    }
  },
};
