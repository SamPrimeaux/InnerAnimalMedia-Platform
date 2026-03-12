## [2026-03-11] Full day — FloatingPreviewPanel, rollback, overwrite recovery, theme + boot, deploy

### What was asked (across the day)
Multiple tasks: (1) Add FloatingPreviewPanel to AgentDashboard, deploy; (2) Roll back that deploy (revert AgentDashboard + agent.html v15); (3) User overwrote AgentDashboard.jsx from Downloads and ran deploy; (4) This task: confirm sam-rules loaded, create session log, fix theme (sync script), fix /api/agent/boot to return integrations, run deploy.

### Files changed (full day)
- `agent-dashboard/src/AgentDashboard.jsx`: early — added import FloatingPreviewPanel, activeTab state, replaced inline preview block with FloatingPreviewPanel (open, activeTab, onTabChange, onClose, activeThemeSlug); then reverted (removed import/state/panel, restored inline block); later overwritten by copy from /Users/samprimeaux/Downloads/AgentDashboard.jsx (user recovery). No further edits this task.
- `dashboard/agent.html`: reverted ?v=16 to ?v=15; no change this task — lines 7–14 already have sync theme script.
- `worker.js` lines 1956–1959 (this task): after boot batch fetch, added getSession(env, request), userId, query `SELECT provider FROM user_oauth_tokens WHERE user_id=?`, built integrations object, added integrations to boot payload.
- `.cursor/rules/sam-rules.mdc`: created (copied from Downloads).
- `.cursor/rules/hard-rules.mdc`: created earlier in day (hard rules, no deploy without approval).
- `docs/cursor-session-log.md`: created (this file).

### Files NOT changed (and why)
- `FloatingPreviewPanel.jsx`: not touched per rules.
- `worker.js` handleGoogleOAuthCallback, handleGitHubOAuthCallback: not touched per rules.
- `agent.html` beyond existing script: no edit — sync script already present.

### Deploy status
- Earlier: deploy with FloatingPreviewPanel (v16, R2 uploads, worker deploy); then rollback in repo only (no re-upload/re-deploy). Production stayed on v16 bundle.
- User recovery: cp Downloads/AgentDashboard.jsx into agent-dashboard; agent-dashboard built; R2 uploads (JS, CSS, agent.html) and worker deploy done.
- This task: deploy-to-r2.sh + wrangler deploy run in Step 4. deploy-to-r2.sh failed after agent-dashboard build (overview-dashboard vite not in PATH); R2 uploads (agent-dashboard.js, agent-dashboard.css, agent.html) and worker deploy run manually. Version ID: eefc1375-7359-46e7-ae68-24e5e3b70bcd.
- Deploy approved by Sam: yes (instructed in this task).

### What is live now
After Step 4: Agent dashboard (FloatingPreviewPanel from Sam’s copy). Theme set synchronously from localStorage before React. /api/agent/boot returns integrations (e.g. github, google_drive) from user_oauth_tokens for the current user. Worker and R2 at version from final deploy.

### Known issues / next steps
- deploy-to-r2.sh can fail after agent-dashboard build when building overview-dashboard (vite not in PATH); R2 uploads may need to be run manually.
- google_drive token expired — refresh on use; do not delete.

---

## [2026-03-11] Three surgical fixes: CSS vars, z-index, active theme D1

### What was asked
Three surgical fixes: (1) AgentDashboard.jsx replace --bg-canvas and --text-primary with --bg-surface and --color-text; (2) shell.css topbar z-index 200, dropdowns 300; agent.html add #agent-dashboard-root { isolation: isolate; }; (3) Run D1 INSERT for user_preferences active_theme, report where /api/settings/theme reads from. Then build and deploy.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx`: 12x var(--bg-canvas) -> var(--bg-surface), 1x var(--text-primary) -> var(--color-text). No other changes.
- `static/dashboard/shell.css`: line 5 .topbar z-index 1000 -> 200; lines 32-33 dropdown block z-index 1100 -> 300.
- `dashboard/agent.html`: after .main-content.agent-page-main #agent-dashboard-root block, added #agent-dashboard-root { isolation: isolate; }.

### Files NOT changed (and why)
- FloatingPreviewPanel.jsx, handleGoogleOAuthCallback, handleGitHubOAuthCallback, wrangler.production.toml: not touched per rules.

### FIX 3 - D1 and /api/settings/theme
- D1 INSERT failed: user_preferences has no column preference_key (schema uses key/value).
- GET /api/settings/theme reads: (1) user_settings.theme (SELECT theme FROM user_settings WHERE user_id = ?); (2) fallback user_preferences (SELECT value FROM user_preferences WHERE user_id = ? AND key = 'theme_preset'). So use user_settings.theme or user_preferences (key='theme_preset', value=slug) for API to pick up theme.

### Deploy status
- Built: yes. R2 uploaded: yes (agent-dashboard.js, agent-dashboard.css, agent.html, shell.css). Worker deployed: yes. Version ID: 78532992-04df-4f65-b9ac-b0d8fa130282. Deploy approved by Sam: yes.

### What is live now
Agent dashboard uses --bg-surface and --color-text. Shell topbar z-index 200, dropdowns 300; #agent-dashboard-root isolation: isolate. R2 and worker deployed.

### Known issues / next steps
- user_preferences INSERT failed; use user_settings.theme or user_preferences key='theme_preset' for theme API. deploy-to-r2.sh still fails after agent-dashboard at overview-dashboard (vite not in PATH).

---

## [2026-03-11] Cache buster v17, z-index revert, file-click order, Monaco resizable, theme API check, deploy

### What was asked
SECOND: Bump agent.html cache buster ?v=15 to ?v=17. THIRD: Revert shell.css z-index (.topbar 1000, dropdowns 1100); keep #agent-dashboard-root isolation in agent.html. FOURTH: FloatingPreviewPanel file click handlers — set state file first, content second, tab switch last. FIFTH: Monaco container flex/minHeight/overflow, Editor height 100%. SIXTH: Verify /api/settings/theme — confirm query and theme table; if different state what it does and do not rewrite. DEPLOY: deploy-to-r2.sh, confirm four R2 uploads, wrangler deploy, paste version ID. Log everything; do not touch OAuth callbacks or wrangler.production.toml.

### Files changed
- `dashboard/agent.html` lines 758-759: ?v=15 -> ?v=17 for agent-dashboard.css and agent-dashboard.js.
- `static/dashboard/shell.css` line 5: z-index 200 -> 1000 (.topbar). Lines 32-33: z-index 300 -> 1100 (dropdowns).
- `agent-dashboard/src/FloatingPreviewPanel.jsx`: openFileInCode (lines 380-386) — reordered .then to setCodeFilename, setSelectedFileForView, onCodeContentChange(text), setEditMode(false), onTabChange("code") last. openGdriveFileInCode (397-402): setCodeFilename, onCodeContentChange, setEditMode, onTabChange last, then setSelectedFileForView in block. openGithubFileInCode (421-426): same order. Line 1117: Monaco wrapping div style flex: 1, minHeight: 120 -> flex: 1, minHeight: 0, overflow: "hidden". Editor already had height="100%".

### Files NOT changed (and why)
- worker.js handleGoogleOAuthCallback, handleGitHubOAuthCallback: not touched. wrangler.production.toml: not touched. agent.html #agent-dashboard-root { isolation: isolate } left as-is.

### SIXTH — Theme API (worker.js)
- GET /api/settings/theme does: (1) SELECT theme FROM user_settings WHERE user_id = ? (line 670). (2) If no row, fallback SELECT value FROM user_preferences WHERE user_id = ? AND key = 'theme_preset'. (3) It does NOT use "SELECT theme_data FROM themes WHERE id = ?". It uses slug from (1) or (2) and runs SELECT name, config FROM cms_themes WHERE slug = ? (line 676). (4) It parses config (JSON), builds variables object from config fields (bg, surface, nav, text, border, primary, etc.), returns { theme, name, variables }. So table is cms_themes (columns name, config), not themes (theme_data, id). No code change; reported only.

### Deploy status
- Built: yes (agent-dashboard). deploy-to-r2.sh ran to completion (guarded overview/time-tracking builds). R2 uploads confirmed: agent-sam/static/dashboard/agent/agent-dashboard.js, agent-sam/static/dashboard/agent/agent-dashboard.css, agent-sam/static/dashboard/agent.html, agent-sam/static/dashboard/shell.css. Worker deployed: yes. Version ID: 7ffda7c1-6820-4ce0-87e9-04bb93d23be7. Deploy approved by Sam: yes (instructed in task).

### What is live now
Agent dashboard at ?v=17. Shell .topbar z-index 1000, dropdowns 1100; #agent-dashboard-root isolation: isolate. File-open in panel: file state then content then tab switch. Monaco container flex/minHeight:0/overflow hidden; Editor height 100%. Theme API unchanged (user_settings.theme + cms_themes.config).

### Known issues / next steps
- None recorded.

---

## [2026-03-11] Surgical revert --bg-surface → --bg-canvas, cache v18, deploy

### What was asked
Revert last session’s wrong change: AgentDashboard.jsx had --bg-surface (theme API does not output it; cfg.bg → --bg-canvas). Replace every var(--bg-surface) with var(--bg-canvas); leave var(--color-text) as-is. Bump agent.html cache buster ?v=17 → ?v=18. Deploy (deploy-to-r2.sh, wrangler deploy), confirm four R2 uploads, paste version ID, append session log.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx` lines 575, 669, 708, 714, 724, 767, 811, 1000, 1016, 1024, 1124, 1126: 12x var(--bg-surface) → var(--bg-canvas). No other changes.
- `dashboard/agent.html` lines 758-759: ?v=17 → ?v=18 for agent-dashboard.css and agent-dashboard.js.

### Files NOT changed (and why)
- FloatingPreviewPanel.jsx, worker.js OAuth callbacks, wrangler.production.toml: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard). R2 uploaded: yes — agent-sam/static/dashboard/agent/agent-dashboard.js, agent-sam/static/dashboard/agent/agent-dashboard.css, agent-sam/static/dashboard/agent.html, agent-sam/static/dashboard/shell.css. Worker deployed: yes. Version ID: f4feeddc-12ca-483c-a37e-a68225c7d204. Deploy approved by Sam: yes (instructed in task).

### What is live now
Agent dashboard backgrounds use var(--bg-canvas) again; theme API’s cfg.bg resolves correctly. Cache buster v18; all four files on R2 and worker at above version.

### Known issues / next steps
- None recorded.

---

## [2026-03-11] Static cache fix: noCache when ?v=, KV deletes, deploy

### What was asked
Find static file handler and KV cache key in worker.js; fix cache key ignoring ?v= (either include query string or skip cache for versioned static). Delete stale KV keys for agent-dashboard.js/css; deploy; log. Do not touch OAuth handlers.

### STEP 1 — What the code uses
The worker does **not** use KV for static file serving. Static assets are served from R2 only. Relevant lines 764–788: `assetKey = path.slice(1)` (path = url.pathname, so query string never included); R2 get via ASSETS/DASHBOARD; `noCache = pathLower.startsWith('/static/dashboard/agent/') || pathLower.startsWith('/dashboard/')`. So no KV cache read for static in this codebase; if production was serving stale, it may be edge or another layer.

### Files changed
- `worker.js` line 787: added `|| url.searchParams.has('v')` to noCache so any request with a `v` query param (e.g. ?v=18) gets Cache-Control: no-cache. OAuth handlers and all other code untouched.

### Files NOT changed (and why)
- handleGoogleOAuthCallback, handleGitHubOAuthCallback, wrangler.production.toml, agent.html, FloatingPreviewPanel.jsx: not touched per rules.

### KV
- Namespace 62013f3a1adf4be0a046840836aec3ab: key list was empty. Deleted keys "static:dashboard/agent/agent-dashboard.js" and "static:dashboard/agent/agent-dashboard.css" (commands ran; no error). Repo KV namespace 09438d5e4f664bf78467a15af7743c44 has only screenshots/* and mcp — no static:dashboard keys.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-sam/static/dashboard/agent/agent-dashboard.js, agent-sam/static/dashboard/agent/agent-dashboard.css, agent-sam/static/dashboard/agent.html, agent-sam/static/dashboard/shell.css. Worker deployed: yes. Version ID: 820727aa-8da7-4abf-8b3f-aa759d3f5268. Deploy approved by Sam: yes (instructed in task).

### What is live now
Worker sends no-cache for static requests that include ?v= (versioned JS/CSS). Stale KV keys deleted in namespace 62013f3a... R2 and worker at above version.

### Known issues / next steps
- None recorded.

---

## [2026-03-11] Five surgical fixes: theme API, Monaco mount, resize, isolation, chat scroll, deploy

### What was asked
Apply 5 surgical fixes (theme API apply in agent.html; Monaco always mounted in FloatingPreviewPanel; resize divider wired to handlePanelResize in AgentDashboard; remove #agent-dashboard-root isolation in agent.html; messages container overflow in AgentDashboard). No deploy until all 5 confirmed; then deploy-to-r2.sh and wrangler deploy. Log and paste version ID.

### Files changed
- `dashboard/agent.html` line 1002: `d.theme_data` -> `d.variables`, `applyDynamicTheme(savedTheme, d.theme_data)` -> `applyDynamicTheme(savedTheme, { css_vars: d.variables })`. Lines 382-384: removed `#agent-dashboard-root { isolation: isolate; }` block.
- `agent-dashboard/src/FloatingPreviewPanel.jsx` lines 1050-1051: removed `{activeTab === "code" && (`; div now always mounted with `display: activeTab === "code" ? "flex" : "none"`. Lines 1191-1192: removed closing `)}` for conditional.
- `agent-dashboard/src/AgentDashboard.jsx` lines 1159-1160: divider `onMouseDown={onDragStart}` -> `onMouseDown={handlePanelResize}`, `onTouchStart={...}` -> `onTouchStart={handlePanelResizeTouch}`. Lines 620-630: messages container `overflow: "hidden auto"` -> `overflowY: "auto", overflowX: "hidden"`.
- `static/dashboard/shell.css`: no change — .topbar already z-index 1000, dropdowns 1100.

### Files NOT changed (and why)
- worker.js OAuth callbacks, wrangler.production.toml: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard). R2 uploaded: yes — agent-sam/static/dashboard/agent/agent-dashboard.js, agent-dashboard.css, agent.html, shell.css (+ other dashboard assets). Worker deployed: yes. Version ID: e7ff56ae-8c6a-4915-812e-0f9ae408f6ca. Deploy approved by Sam: yes (instructed after all 5 fixes confirmed).

### What is live now
Agent page applies API theme via d.variables and applyDynamicTheme({ css_vars }). Monaco stays mounted, hidden when tab !== code. Panel resize drag updates panelWidthPct. Shell dropdowns above content (isolation removed). Chat messages scroll inside container. Shell z-index 1000/1100 unchanged.

### Known issues / next steps
- None recorded.

---

## [2026-03-11] Toolbar onClick (File/Search/Source) + panel body flex (Terminal/Browser), deploy

### What was asked
Two surgical fixes: (1) Add onClick to File, Search, Source control toolbar buttons in AgentDashboard.jsx to open panel on Files tab; (2) In FloatingPreviewPanel.jsx ensure Terminal and Browser tab content have flex: 1, minHeight: 0 so panel body gets height. Then run deploy and log.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx` lines 583, 590, 597: added `onClick={() => { setActiveTab("files"); setPreviewOpen(true); }}` to the File, Search, and Source control buttons.
- `agent-dashboard/src/FloatingPreviewPanel.jsx`: Browser tab (lines 753–754) — wrapped content in a div with `style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}` (replaced fragment). Terminal tab (line 1194): added `minHeight: 0` to the outer div style.

### Files NOT changed (and why)
- worker.js OAuth, wrangler.production.toml, agent.html theme logic: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard). R2 uploaded: yes — agent-sam/static/dashboard/agent/agent-dashboard.js, agent-dashboard.css, agent.html, shell.css (+ other dashboard assets). Worker deployed: yes. Version ID: 0bfd1512-8c79-4516-b129-70f1c30760b7. Deploy approved by Sam: yes (run deploy and log).

### What is live now
All 5 toolbar icons open the panel: File, Search, Source control open to Files tab; Terminal and Browser unchanged. Panel body has correct flex/minHeight so Terminal and Browser tab content fill and are visible.

### Known issues / next steps
- None recorded.

## [2026-03-11] Audit + 3 fixes (stacking context, panel in-flow, cache buster) — no deploy

### What was asked
Audit root/chat/panel styles and FloatingPreviewPanel placement; Fix 1 remove stacking-context from root/wrapper so shell dropdowns don't fall behind; Fix 2 ensure panel is flex sibling not overlay; Fix 3 bump agent.html ?v=18 to ?v=19. No deploy until all confirmed.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx` lines 541–548: Removed `position: "relative"` from the flex row wrapper div (the one that wraps both chat pane and FloatingPreviewPanel). No other changes to root container (it had no transform, opacity, willChange, filter, isolation, or position+zIndex).
- `dashboard/agent.html` lines 758–759: Bumped `?v=18` to `?v=19` on both the CSS and JS imports.

### Files NOT changed (and why)
- `FloatingPreviewPanel.jsx`: No change. Outermost div is already position unset (static), flex: 1, no 100vw/100vh; panel is already a flex sibling in the same row as the chat pane. No overlay bug found.
- `worker.js`, `wrangler.production.toml`, OAuth/theme logic: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html, other dashboard assets per script. Worker deployed: yes — version ID: 7547c505-5b9d-4483-9f95-56b5cabfa705. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with stacking-context fix (no position: relative on flex row wrapper), cache buster ?v=19 on agent page. Worker and R2 at version from this deploy.

### Known issues / next steps
- None recorded.

## [2026-03-11] Monaco defineTheme safeHex guard (FloatingPreviewPanel) — no deploy until confirmed

### What was asked
Surgical fix in FloatingPreviewPanel.jsx: Monaco onMount/defineTheme was receiving undefined color values from CSS vars (get() returns undefined when var missing), causing parseHex to crash. Add safeHex guard for every color and only run defineTheme when all values are valid hex. Bump agent.html ?v=19 to ?v=20. No deploy until confirmed.

### Files changed
- `agent-dashboard/src/FloatingPreviewPanel.jsx`: Added module-level `safeHex(val, fallback)` (after getMonacoLanguage). In the useEffect (lines 224–250), DiffEditor onMount, and Editor onMount: compute each color with safeHex(get("--var"), fallback), guard defineTheme with `.every((c) => c && c.startsWith("#"))`, pass the safe variables into colors. Fallbacks: #1e1e1e (bg), #d4d4d4 (fg), #858585 (muted), #264f78 (accent-dim), #aeafad (accent), #2d2d2d (elevated).
- `dashboard/agent.html` lines 758–759: Bumped ?v=19 to ?v=20 on CSS and JS imports.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, AgentDashboard.jsx, OAuth/theme logic: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html, other dashboard assets per script. Worker deployed: yes — version ID: 1e74fcc2-3d5b-4f49-a866-23df42756a1c. Deploy approved by Sam: yes.

### What is live now (this task)
Agent dashboard with Monaco safeHex guard (?v=20). Worker and R2 at version from this deploy.

### Known issues / next steps
- None recorded.

## [2026-03-11] Footer + Files panel flex fixes (?v=21)

### What was asked
Apply two surgical fixes: (1) AgentDashboard.jsx chat pane add minHeight: 0 so footer/input stays in viewport; (2) FloatingPreviewPanel.jsx Files tab list container add minHeight: 0, overflowY: auto, overflowX: hidden. Bump agent.html to ?v=21, then build and deploy.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx` lines 553–559: Added `minHeight: 0` to the chat pane (iam-chat-pane) style object.
- `agent-dashboard/src/FloatingPreviewPanel.jsx` line 924: Replaced file list container style `overflow: "auto"` with `minHeight: 0`, `overflowY: "auto"`, `overflowX: "hidden"` (kept flex: 1, padding: "8px").
- `dashboard/agent.html` lines 758–759: Bumped ?v=20 to ?v=21 on CSS and JS imports.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, OAuth/Monaco/theme: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html, other dashboard assets. Worker deployed: yes — version ID: 989ed4f7-c1df-4696-b25c-d7698c43cbdf. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with chat pane minHeight: 0 (footer always visible) and Files tab scrollable list (?v=21). Worker and R2 at version from this deploy.

### Known issues / next steps
- None recorded.

## 2026-03-11 Agent page height fix (agent.html only)

### What was asked
Fix agent dashboard root height: shell `.main-content.agent-page-main` had no bounded height, so React app expanded to content and footer fell off. Add height/max-height to shell and height: 100% to #agent-dashboard-root; bump cache to ?v=23; upload agent.html to R2 only.

### Files changed
- `dashboard/agent.html` lines 372–381: Added `height: calc(100vh - 60px)` and `max-height: calc(100vh - 60px)` to `.main-content.agent-page-main`; added `height: 100%` to `.main-content.agent-page-main #agent-dashboard-root`.
- `dashboard/agent.html` lines 755–756: Bumped `?v=21` to `?v=23` on agent-dashboard.css and agent-dashboard.js link/script.

### Files NOT changed (and why)
- worker.js, FloatingPreviewPanel.jsx, agent-dashboard React source: not touched; HTML-only fix per request.

### Deploy status
- Built: no (no React build). R2 uploaded: yes — agent.html to agent-sam/static/dashboard/agent.html. Worker deployed: no. Deploy approved by Sam: N/A (R2 upload only).

### What is live now
Agent page shell has bounded height (100vh - 60px) and #agent-dashboard-root has height: 100%, so React app fills viewport and footer stays visible. agent.html served from R2 with ?v=23.

### Known issues / next steps
- None recorded.

## 2026-03-11 Five surgical UI fixes + deploy

### What was asked
Deploy approved after 5 surgical fixes in AgentDashboard.jsx: (1) chat input visible background, (2) mic button left of send with Web Speech API, (3) paper airplane send icon, (4) toolbar toggle panel on same-tab click, (5) layout report only. Then bump agent.html to ?v=24, build, R2 upload, worker deploy.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx`: FIX 1 textarea style (background/border/borderRadius); FIX 2 recognitionRef, isListening, toggleMic, mic button between + and textarea (old overlay mic removed); FIX 3 send button paper-airplane SVG; FIX 4 all 5 toolbar buttons toggle logic. No FIX 5 code change.
- `dashboard/agent.html` lines 758–759: Bumped ?v=23 to ?v=24 for agent-dashboard.css and agent-dashboard.js.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html, other dashboard assets. Worker deployed: yes — version ID: ea89898c-d599-442f-88b4-1874a002b5f2. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with input bar styling, mic (talk-to-type) left of send, paper-airplane send icon, toolbar toggles panel when same tab clicked, agent.html at ?v=24. Worker at version above.

### Known issues / next steps
- None recorded.

## 2026-03-11 Send button color + toolbar gap + deploy

### What was asked
Deploy approved. Two-line AgentDashboard.jsx fix: (1) send button color to var(--color-text) to match mic; (2) remove gap under toolbar by changing Messages area padding from 16px to 0 16px 16px 16px. agent.html bumped to ?v=25; full build and R2 upload then worker deploy.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx`: send button style color set to "var(--color-text)"; Messages div padding changed from "16px" to "0 16px 16px 16px".
- `dashboard/agent.html` lines 758–759: ?v=24 to ?v=25 for agent-dashboard.css and agent-dashboard.js.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html, other dashboard assets. Worker deployed: yes — version ID: 5130315a-7a97-4e48-b221-fc6a7f769fc4. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with send button color var(--color-text), no gap under toolbar (Messages padding 0 16px 16px 16px), agent.html at ?v=25. Worker at version above.

### Known issues / next steps
- None recorded.

## 2026-03-11 Status bar, context gauge, mode selector, recent files (apply only)

### What was asked
Apply the 4 planned changes in AgentDashboard.jsx: (1) move status bar below input bar, (2) add context gauge in input bar between mic and send with inputBarContextPct state, (3) add mode selector Ask/Plan/Debug/Agent between + and textarea, (4) add recentFiles state and conditional strip below status bar.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx`: Added state inputBarContextPct, mode, modePopupOpen, modePopupRef, recentFiles. Wired setInputBarContextPct on message send (totalTokens/200000). Reordered chat pane: Messages then Input bar then Status bar then recent-files conditional. Inserted mode button + popup after + button; inserted context gauge SVG after mic (tooltip, 200k denominator, var(--color-danger) when >80%). Added outside-click close for mode popup. Recent files strip renders only when recentFiles.length > 0 (placeholder div).
- `dashboard/agent.html` lines 758–759: ?v=25 to ?v=26 for agent-dashboard.css and agent-dashboard.js (deploy step).

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx, agent.html: not touched per rules. No version bump or deploy in this step.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html (?v=26), other dashboard assets. Worker deployed: yes — version ID: 47a964ea-a692-4dda-8bb1-ace7844c088d. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with status bar below input bar, input-bar context gauge (200k), mode selector (Ask/Plan/Debug/Agent), recent-files placeholder strip; agent.html at ?v=26. Worker at version above.

### Known issues / next steps
- None.

## 2026-03-11 Toolbar gap, mode/model inside input box (apply only, deploy pending)

### What was asked
Apply four fixes: (1) toolbar bottom padding 6px 12px to 6px 12px 0 12px, (2) move mode selector inside iam-chat-input-main bottom bar and restructure input as flex column with wrapper background/border, (3) add model selector next to mode in bottom bar with MODEL_LABELS and boot models popup, (4) remove textarea background/border. Describe changes and expected UI; await deployment approval.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx`: Toolbar icon row padding set to "6px 12px 0 12px". Added MODEL_LABELS constant; modelPopupOpen, modelPopupRef; outside-click closes model popup. Removed mode selector from left group. Restructured iam-chat-input-main: wrapper has background/border/borderRadius/overflow; inner row has textarea (transparent, no border) + send overlay; new bottom bar has borderTop, mode selector, model selector (Auto + models from boot). Textarea lost background/border/borderRadius.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx, agent.html: not touched. No version bump or deploy until Sam approves.

### Deploy status
- Built: no. R2 uploaded: no. Worker deployed: no. Deploy approved by Sam: no (awaiting final deployment command).

### What is live now
Unchanged from previous deploy (version 47a964ea). Local repo has toolbar gap fix and mode/model inside input box.

### Known issues / next steps
- When Sam says deploy approved: bump agent.html to ?v=27, run deploy-to-r2.sh, npm run deploy, paste version ID.

## 2026-03-11 iam-chat-pane remove width 100%

### What was asked
Remove width: "100%" from the iam-chat-pane div style object in AgentDashboard.jsx. One-line change, approval given ("go").

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx` lines 609-612: Removed `width: "100%"` from the iam-chat-pane div style object.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx, agent.html: not touched.

### Deploy status
- Built: no. R2 uploaded: no. Worker deployed: no. Deploy approved by Sam: no.

### What is live now
Unchanged. Local repo has iam-chat-pane without width: 100%.

### Known issues / next steps
- None.

## 2026-03-11 Full deploy: toolbar, mode/model, iam-chat-pane, v27

### What was asked
Bundle all pending changes (toolbar gap, mode/model inside input box, iam-chat-pane width removed), bump version to ?v=27, build, deploy, paste version ID.

### Files changed
- `dashboard/agent.html` lines 758-759: ?v=26 to ?v=27 for agent-dashboard.css and agent-dashboard.js.

### Files NOT changed (and why)
- AgentDashboard.jsx and other code unchanged in this step; already contained pending changes. worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx: not touched.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html (?v=27), other dashboard assets. Worker deployed: yes — version ID: 86131f25-7ecb-41a3-a43f-d28b4c24901a. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with toolbar gap fix (padding 6px 12px 0 12px), mode and model selectors inside input box bottom bar, iam-chat-pane without width: 100%, agent.html at ?v=27. Worker at version above.

### Known issues / next steps
- None.

## 2026-03-11 Panel resize bar slim + hover, v28 deploy

### What was asked
Apply iam-panel-resize changes (width/minWidth 12px to 2px, padding 0, onMouseEnter/onMouseLeave for hover highlight), then bump to ?v=28, build, deploy-to-r2.sh, wrangler deploy, paste version ID. Deploy approved.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx`: iam-panel-resize div — width "12px" to "2px", minWidth "12px" to "2px", padding "0 4px" to 0; added onMouseEnter/onMouseLeave for primary hover highlight.
- `dashboard/agent.html` lines 758-759: ?v=27 to ?v=28.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, FloatingPreviewPanel.jsx: not touched.

### Deploy status
- Built: yes (agent-dashboard via deploy-to-r2.sh). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html (?v=28), other dashboard assets. Worker deployed: yes — version ID: ef0d1f49-6d9d-447a-9cbf-3fb371fa30ba. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with slim panel resize bar (2px, no padding), hover highlight; agent.html at ?v=28. Worker at version above.

### Known issues / next steps
- None.

## [2026-03-11] AgentDashboard popup overflow, send button to bottom bar, textarea padding

### What was asked
Three changes in AgentDashboard.jsx: (1) iam-chat-input-main overflow "hidden" to "visible"; (2) remove send button from overlay, add to bottom bar with marginLeft "auto"; (3) textarea padding "10px 80px 10px 12px" to "10px 12px". Then bump version, build, deploy, paste version ID. Deploy approved.

### Files changed
- `agent-dashboard/src/AgentDashboard.jsx` line 1156: overflow "hidden" -> "visible" on iam-chat-input-main.
- `agent-dashboard/src/AgentDashboard.jsx` lines 1185, 1191-1232, 1381-1382: textarea padding to "10px 12px"; removed absolute send-button wrapper and button; added send button as last child of bottom bar with marginLeft "auto", same styles and onClick.
- `package.json` line 3: version "1.0.0" -> "1.0.1".

### Files NOT changed (and why)
- worker.js, agent.html, wrangler.production.toml, FloatingPreviewPanel.jsx: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css. Worker deployed: yes — version ID: 84bebd43-472b-41b9-87cc-14bffd83e1fd. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with popup overflow visible, send button in bottom bar (Mode | Model | Send), textarea padding 10px 12px. Package version 1.0.1.

### Known issues / next steps
- None.

## [2026-03-11] FloatingPreviewPanel terminal input focus (ref, autoFocus, useEffect)

### What was asked
FloatingPreviewPanel.jsx: add terminalInputRef, autoFocus and onClick focus on terminal input, and useEffect to focus input when terminal tab becomes active. Apply, deploy, document. Approved.

### Files changed
- `agent-dashboard/src/FloatingPreviewPanel.jsx` after line 117: added `const terminalInputRef = useRef(null);`.
- `agent-dashboard/src/FloatingPreviewPanel.jsx` after terminal WebSocket useEffect: added useEffect that focuses terminalInputRef when activeTab === "terminal".
- `agent-dashboard/src/FloatingPreviewPanel.jsx` terminal input element: added ref={terminalInputRef}, onClick={() => terminalInputRef.current?.focus()}, autoFocus.

### Files NOT changed (and why)
- worker.js, agent.html, wrangler.production.toml: not touched. AgentDashboard.jsx: not changed this task.

### Deploy status
- Built: yes (agent-dashboard). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css. Worker deployed: yes — version ID: 659a0138-48fa-4a76-9e9a-6e1f64baf13f. Deploy approved by Sam: yes.

### What is live now
Agent dashboard with FloatingPreviewPanel terminal input focused when terminal tab is active (ref, autoFocus, onClick, useEffect). R2 and worker at version above.

### Known issues / next steps
- None.

## [2026-03-11] Terminal WS debug: console.log readyState, v=29 deploy

### What was asked
Add console.log of WS readyState in sendTerminalKey (FloatingPreviewPanel.jsx), bump to v=29, build, deploy. Debug terminal Enter no-response (WS cycling Disconnected/Connected). Deploy approved.

### Files changed
- `agent-dashboard/src/FloatingPreviewPanel.jsx` sendTerminalKey: added `console.log("WS readyState:", terminalWsRef.current?.readyState);` before readyState guard.
- `dashboard/agent.html` lines 758-759: ?v=28 to ?v=29 for CSS and JS.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml: not touched.

### Deploy status
- Built: yes (agent-dashboard). R2 uploaded: yes — agent-dashboard.js, agent-dashboard.css, agent.html. Worker deployed: yes — version ID: 2fdefe85-83c2-4990-b7cd-9fe93209c4d0. Deploy approved by Sam: yes.

### What is live now
Agent dashboard at v=29 with terminal sendTerminalKey logging WS readyState to Console on Enter. Test: open terminal, press Enter, check Console for number (1=OPEN).

### Known issues / next steps
- Remove console.log after confirming readyState value; address WS reconnection if needed.

---

## [2026-03-11] FloatingPreviewPanel WebSocket cleanup guard, R2 bundle upload, v=30, deploy

### What was asked
(1) Push new agent-dashboard bundle to R2. (2) Bump ?v= in agent.html (was 29). (3) Deploy worker. (4) Document and give architectural overview of the build; update cursor logs.

### Files changed
- `agent-dashboard/src/FloatingPreviewPanel.jsx`: WebSocket useEffect guard — added wsGuardRef, openRef, activeTabRef, mountedRef; effect skips if terminalWsRef.current?.readyState < 2; cleanup only closes when !mountedRef.current || !openRef.current || activeTabRef.current !== "terminal" (re-render flicker leaves socket alive). Unmount effect sets mountedRef.current = false.
- `dashboard/agent.html` lines 758-759: ?v=29 -> ?v=30 for agent-dashboard.css and agent-dashboard.js.

### Files NOT changed (and why)
- worker.js, wrangler.production.toml, OAuth callbacks: not touched per rules.

### Deploy status
- Built: yes (agent-dashboard, Vite, dist/agent-dashboard.js). R2 uploaded: yes — agent-sam/static/dashboard/agent/agent-dashboard.js, agent-sam/static/dashboard/agent.html (v=30). Worker deployed: yes — version ID: 7eb02ee0-af5b-4ac0-acf1-aae3bdb0df61. Deploy approved by Sam: yes (instructed in task).

### What is live now
Agent dashboard at ?v=30 with FloatingPreviewPanel terminal WebSocket fix: cleanup only closes when panel closes, tab leaves terminal, or component unmounts; re-render flicker no longer tears down the socket. Worker and R2 at version above.

### Known issues / next steps
- Remove sendTerminalKey console.log when no longer needed.

---

## Build architecture overview (reference)

**Worker**
- Single entry: repo root `worker.js`; deployed via `wrangler deploy -c wrangler.production.toml` (use `./scripts/with-cloudflare-env.sh`). No separate worker build; R2 copy `agent-sam/source/worker-source.js` is backup only.

**Dashboard / agent app**
- **Repo:** `dashboard/*.html` (shell pages), `agent-dashboard/` (Vite + React). Agent app source: `agent-dashboard/src/AgentDashboard.jsx`, `agent-dashboard/src/FloatingPreviewPanel.jsx`; build output: `agent-dashboard/dist/agent-dashboard.js` and `agent-dashboard/dist/agent-dashboard.css`.
- **R2 (bucket agent-sam):** HTML at `static/dashboard/<name>.html` (e.g. `agent.html`); agent bundle at `static/dashboard/agent/agent-dashboard.js`, `agent-dashboard.css`. Worker serves these by key; cache bust via ?v= in agent.html.
- **Flow:** Edit source in repo -> `npm run build` in agent-dashboard -> upload changed files to R2 (agent-sam) with `--remote` -> bump ?v= in agent.html if JS/CSS changed -> upload agent.html to R2 -> deploy worker (`npm run deploy` or `./scripts/with-cloudflare-env.sh wrangler deploy -c wrangler.production.toml`).

**R2 buckets (production)**
- **agent-sam (DASHBOARD):** Dashboard HTML, agent + overview + time-tracking JS/CSS, shell.css, worker backup at `source/worker-source.js`.
- **iam-platform (R2):** Memory, daily logs, platform data (not worker/dashboard source).

**Credentials**
- `./scripts/with-cloudflare-env.sh` loads CLOUDFLARE_API_TOKEN (e.g. from `.env.cloudflare`); required for R2 and deploy.

**Canonical deploy/docs**
- `docs/LOCATIONS_AND_DEPLOY_AUDIT.md` — locations, R2 keys, commands. `.cursor/rules/dashboard-r2-before-deploy.mdc` — upload dashboard files to R2 before worker deploy when dashboard/ changed.

---

## [2026-03-11] Terminal lock-down — debug removed, rules added, R2 backup

### What was asked
Lock down terminal after it was working: (1) Remove debug lines from Worker; (2) User runs cleanup/push/backup on ~/iam-pty and IAM_SECRETS.env; (3) Add Cursor rule and document.

### Files changed
- `worker.js`: Removed debug instrumentation (TERMINAL_SECRET_set log, logUpstreamClose, upstream close event payload). Terminal/ws path unchanged otherwise.
- `.cursor/rules/terminal-pty-lockdown.mdc`: New rule — PERMANENT DO NOT TOUCH LIST (cloudflared config no http2, iam-pty ecosystem, LaunchAgents, conflicting server/terminal.js and iam-terminal-server, wrangler, OAuth handlers).

### Files NOT changed (and why)
- ~/iam-pty/server.js, ~/IAM_SECRETS.env: outside repo; user runs sed/git/cat per their steps 1, 2, 4.
- FloatingPreviewPanel.jsx, agent.html, wrangler.production.toml: not touched.

### Deploy status
- Built: no (worker.js only; no dashboard build).
- R2 uploaded: see Step 3 (pty-server backup) — run from repo with with-cloudflare-env.sh.
- Worker deployed: no — deploy not requested; only lock-down and backup.
- Deploy approved by Sam: N/A.

### What is live now
Terminal working (TERMINAL_SECRET + TERMINAL_WS_URL; iam-pty). Worker no longer logs debug lines for terminal/ws. Cursor rule prevents touching cloudflared config, iam-pty ecosystem, LaunchAgents, conflicting terminal servers.

### User checklist (run on your machine)
- Step 1: sed cleanup on ~/iam-pty/server.js, pm2 restart iam-pty.
- Step 2: cd ~/iam-pty && git add -A && git commit -m "..." && git push origin main.
- Step 3: R2 backup (see below) — or already run from repo.
- Step 4: cat >> ~/IAM_SECRETS.env with recovery procedure and secrets note.
- Step 5: Rule added in .cursor/rules/terminal-pty-lockdown.mdc.

---

## [2026-03-12] Agent Sam verified repair — WS JSON parsing, Run in terminal handler, tool loop

### What was asked
Implement the verified repair plan: (1) Fix WS onmessage in FloatingPreviewPanel to parse PTY JSON (session_id, output) and stop printing raw JSON in terminal. (2) Add runCommandInTerminal handler and expose via ref for "Run in terminal". (3) Build multi-provider tool loop in worker.js for /api/agent/chat (non-streaming path) with terminal_execute, d1_query, r2_read, r2_list.

### Files changed
- `agent-dashboard/src/FloatingPreviewPanel.jsx`: Added terminalSessionIdRef (line ~152). Replaced ws.onmessage (lines ~550–565) to parse JSON for type session_id (store in ref) and type output (append msg.data); fallback append raw. Added runCommandInTerminal (POST /api/agent/terminal/run, append output, switch to terminal tab). Added optional prop runCommandRunnerRef; useEffect sets runCommandRunnerRef.current = { runCommandInTerminal } when provided.
- `agent-dashboard/src/AgentDashboard.jsx`: Added runCommandRunnerRef, passed runCommandRunnerRef to FloatingPreviewPanel so parent can call runCommandInTerminal when a "Run in terminal" control is wired (no such button in message bubbles yet — messages render plain text; button can be added when code-block rendering is added).
- `worker.js`: After streamDoneDbWrites, added runToolLoop supporting anthropic, openai, google with tools; implements terminal_execute, d1_query (SELECT only), r2_read, r2_list. In /api/agent/chat: added supportsTools, useTools (!wantStream), toolDefinitions from mcp_registered_tools. Added branch: if useTools && toolDefinitions.length > 0, create conversationId if needed, insert user message, runToolLoop, streamDoneDbWrites, return jsonResponse({ content: finalText, role: 'assistant' }).

### Files NOT changed (and why)
- agent.html, wrangler.production.toml, handleGoogleOAuthCallback, handleGitHubOAuthCallback: not touched per rules. Streaming functions unchanged; tool loop is separate non-streaming branch.

### Deploy status
- Built: yes (agent-dashboard npm run build). R2 uploaded: yes — agent-sam/static/dashboard/agent/agent-dashboard.js, agent-sam/static/dashboard/agent.html (v=31). Worker deployed: yes — version ID: fde92b85-69c9-4fd0-a36f-073027000ac2. Deploy approved by Sam: yes.

### What is live now
Worker and dashboard at v=31. WS onmessage parses PTY JSON (session_id, output); runCommandInTerminal ref wired; /api/agent/chat tool loop (non-streaming) with terminal_execute, d1_query, r2_read, r2_list for anthropic/openai/google.

### Known issues / next steps
- No "Run in terminal" button in chat UI yet. runCommandRunnerRef is wired: when message content is rendered with code blocks (e.g. markdown ```bash), add a button that calls runCommandRunnerRef.current?.runCommandInTerminal(blockText). PTY server must send JSON messages { type: "session_id", session_id } and { type: "output", data } for the new onmessage logic to apply.

---

## [2026-03-12] 8:30am CST daily plan cron — scheduled handler + Resend

### What was asked
URGENT: Add scheduled handler for 8:30am CST (13:30 UTC) that queries D1 (tasks, projects, memory, rules, workflows), calls Workers AI for email body, sends via Resend. Add cron to wrangler.production.toml. Deploy before 1:30pm UTC.

### Files changed
- `worker.js` lines 4102-4105: Added branch for event.cron === '30 13 * * *' calling sendDailyPlanEmail(env). Lines 4496-4573: New function sendDailyPlanEmail(env) — Promise.all of 5 D1 queries (cidi tasks, projects, agent_memory_index, agent_cursor_rules, cidi pending workflows), prompt for Agent Sam daily plan, env.AI.run('@cf/meta/llama-3.1-8b-instruct'), extract email body, fetch Resend API with from Agent Sam, to sam@inneranimals.com, subject "Daily Plan — [date]".
- `wrangler.production.toml` lines 91-99: Added "30 13 * * *" to crons array.

### Files NOT changed (and why)
- handleGoogleOAuthCallback, handleGitHubOAuthCallback: not touched. Streaming functions: not touched. agent.html, AgentDashboard.jsx: not changed.

### Deploy status
- Built: no (worker only). R2 uploaded: no. Worker deployed: yes — version ID: 49e47506-db8f-476f-8ea1-1ea5434044f3. Deploy approved by Sam: yes (task said "Deploy immediately after").

### What is live now
Cron "30 13 * * *" registered. First fire: 13:30 UTC (8:30am CDT). Daily plan email will query D1, generate body via Workers AI, send to sam@inneranimals.com via Resend. RESEND_API_KEY must be set in Worker secrets.

### Known issues / next steps
- Verify with wrangler tail when cron fires. Ensure Agent Sam sender (agent@inneranimalmedia.com) is verified in Resend if required.

- After deploy: run verification tests 1–6 from the repair plan (terminal WS, Run in terminal, tool loop Anthropic/OpenAI/Google, RAG).
