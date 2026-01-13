-- Meaux Theme Library - Complete Theme Seeding
-- All 30+ High-End Color Themes with Meaux/Inner Animal Branding
-- Run: wrangler d1 execute inneranimalmedia-business --file=src/seed-meaux-themes.sql --remote

-- ============================================
-- CLAY COLLECTION
-- ============================================

INSERT OR REPLACE INTO themes (id, tenant_id, name, slug, category, description, config_json, is_public, is_active, created_at, updated_at) VALUES
('theme-meaux-clay-light', 'system', 'Meaux Clay Light', 'meaux-clay-light', 'clay', 'Soft claymorphism with light surfaces and gentle shadows', '{"css_vars": {"--bg-surface": "#f7f8fa", "--bg-panel": "#ffffff", "--color-primary": "#2563eb", "--color-secondary": "#7c3aed", "--color-accent": "#06b6d4", "--color-text": "#0f172a", "--color-muted": "#64748b", "--color-border": "rgba(0, 0, 0, 0.08)", "--shadow-clay": "12px 12px 24px rgba(0, 0, 0, 0.08), -12px -12px 24px #ffffff", "--radius": "20px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-clay-dark', 'system', 'Meaux Clay Dark', 'meaux-clay-dark', 'clay', 'Dark claymorphism with deep surfaces and contrast shadows', '{"css_vars": {"--bg-surface": "#1a1f2e", "--bg-panel": "#242938", "--color-primary": "#7c3aed", "--color-secondary": "#ec4899", "--color-accent": "#06b6d4", "--color-text": "#e2e8f0", "--color-muted": "#94a3b8", "--color-border": "rgba(255, 255, 255, 0.1)", "--shadow-clay": "8px 8px 16px rgba(0, 0, 0, 0.4), -8px -8px 16px rgba(255, 255, 255, 0.02)", "--radius": "20px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- PREMIUM MODERN
-- ============================================

('theme-meaux-monochrome', 'system', 'Meaux Monochrome', 'meaux-monochrome', 'modern', 'Clean monochrome design with elegant grayscale palette', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "#fafafa", "--color-primary": "#000000", "--color-secondary": "#171717", "--color-accent": "#404040", "--color-text": "#0a0a0a", "--color-muted": "#737373", "--color-border": "rgba(0, 0, 0, 0.1)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-workflow', 'system', 'Meaux Workflow', 'meaux-workflow', 'productivity', 'Dark productivity theme optimized for workflows', '{"css_vars": {"--bg-surface": "#16181d", "--bg-panel": "#1c1f26", "--color-primary": "#5e6ad2", "--color-secondary": "#26b5ce", "--color-accent": "#95a2b3", "--color-text": "#e6edf3", "--color-muted": "#9ca3af", "--color-border": "rgba(255, 255, 255, 0.1)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-productivity', 'system', 'Meaux Productivity', 'meaux-productivity', 'productivity', 'Light theme designed for focused productivity', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "#f7f6f3", "--color-primary": "#eb5757", "--color-secondary": "#f2994a", "--color-accent": "#6fcf97", "--color-text": "#37352f", "--color-muted": "#9b9a97", "--color-border": "rgba(0, 0, 0, 0.06)", "--radius": "6px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- APPLE ECOSYSTEM
-- ============================================

('theme-meaux-ios-light', 'system', 'Meaux iOS Light', 'meaux-ios-light', 'apple', 'Apple-inspired light theme with iOS design language', '{"css_vars": {"--bg-surface": "#f5f5f7", "--bg-panel": "#ffffff", "--color-primary": "#007aff", "--color-secondary": "#5856d6", "--color-accent": "#34c759", "--color-text": "#1d1d1f", "--color-muted": "#86868b", "--color-border": "rgba(0, 0, 0, 0.1)", "--radius": "18px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-ios-dark', 'system', 'Meaux iOS Dark', 'meaux-ios-dark', 'apple', 'Apple-inspired dark theme with iOS design language', '{"css_vars": {"--bg-surface": "#000000", "--bg-panel": "#1c1c1e", "--color-primary": "#0a84ff", "--color-secondary": "#5e5ce6", "--color-accent": "#30d158", "--color-text": "#ffffff", "--color-muted": "#98989d", "--color-border": "rgba(255, 255, 255, 0.15)", "--radius": "18px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- DEVELOPER TOOLS
-- ============================================

('theme-meaux-code-dark', 'system', 'Meaux Code Dark', 'meaux-code-dark', 'developer', 'GitHub-inspired dark theme for developers', '{"css_vars": {"--bg-surface": "#0d1117", "--bg-panel": "#161b22", "--color-primary": "#58a6ff", "--color-secondary": "#1f6feb", "--color-accent": "#79c0ff", "--color-text": "#c9d1d9", "--color-muted": "#8b949e", "--color-border": "rgba(240, 246, 252, 0.1)", "--radius": "6px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-browser', 'system', 'Meaux Browser', 'meaux-browser', 'developer', 'Modern browser-inspired dark theme', '{"css_vars": {"--bg-surface": "#1e1e1e", "--bg-panel": "#2a2a2a", "--color-primary": "#8b5cf6", "--color-secondary": "#ec4899", "--color-accent": "#06b6d4", "--color-text": "#ffffff", "--color-muted": "#a1a1aa", "--color-border": "rgba(255, 255, 255, 0.1)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-design', 'system', 'Meaux Design', 'meaux-design', 'creative', 'Bold design theme with vibrant colors', '{"css_vars": {"--bg-surface": "#0a0a0a", "--bg-panel": "#1a1a1a", "--color-primary": "#0099ff", "--color-secondary": "#ff0080", "--color-accent": "#00ff99", "--color-text": "#ffffff", "--color-muted": "#999999", "--color-border": "rgba(255, 255, 255, 0.1)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-creative', 'system', 'Meaux Creative', 'meaux-creative', 'creative', 'Light creative theme for design work', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "#f5f5f5", "--color-primary": "#0d99ff", "--color-secondary": "#f24e1e", "--color-accent": "#0acf83", "--color-text": "#1e1e1e", "--color-muted": "#6e6e6e", "--color-border": "rgba(0, 0, 0, 0.1)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-knowledge', 'system', 'Meaux Knowledge', 'meaux-knowledge', 'productivity', 'Dark theme optimized for knowledge work', '{"css_vars": {"--bg-surface": "#1e1e1e", "--bg-panel": "#2d2d2d", "--color-primary": "#7c3aed", "--color-secondary": "#8b5cf6", "--color-accent": "#a78bfa", "--color-text": "#dcddde", "--color-muted": "#b9bbbe", "--color-border": "rgba(255, 255, 255, 0.1)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-galaxy', 'system', 'Meaux Galaxy', 'meaux-galaxy', 'dark', 'Deep space galaxy theme with purple accents', '{"css_vars": {"--bg-surface": "#0a0e14", "--bg-panel": "#12171f", "--color-primary": "#7c3aed", "--color-secondary": "#2563eb", "--color-accent": "#ec4899", "--color-text": "#e2e8f0", "--color-muted": "#94a3b8", "--color-border": "rgba(124, 58, 237, 0.2)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-adaptive', 'system', 'Meaux Adaptive', 'meaux-adaptive', 'modern', 'Adaptive Material Design-inspired theme', '{"css_vars": {"--bg-surface": "#fef7ff", "--bg-panel": "#ffffff", "--color-primary": "#6750a4", "--color-secondary": "#7d5260", "--color-accent": "#006c4c", "--color-text": "#1c1b1f", "--color-muted": "#79747e", "--color-border": "rgba(0, 0, 0, 0.08)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-workspace', 'system', 'Meaux Workspace', 'meaux-workspace', 'productivity', 'Slack-inspired workspace theme', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "#f8f8f8", "--color-primary": "#611f69", "--color-secondary": "#1264a3", "--color-accent": "#2eb67d", "--color-text": "#1d1c1d", "--color-muted": "#616061", "--color-border": "rgba(0, 0, 0, 0.13)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-music', 'system', 'Meaux Music', 'meaux-music', 'entertainment', 'Spotify-inspired dark music theme', '{"css_vars": {"--bg-surface": "#121212", "--bg-panel": "#181818", "--color-primary": "#1db954", "--color-secondary": "#1ed760", "--color-accent": "#ffffff", "--color-text": "#ffffff", "--color-muted": "#b3b3b3", "--color-border": "rgba(255, 255, 255, 0.1)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- EXTENDED COLLECTION
-- ============================================

('theme-meaux-system', 'system', 'Meaux System', 'meaux-system', 'apple', 'System default theme with Apple aesthetics', '{"css_vars": {"--bg-surface": "#f5f5f7", "--bg-panel": "#ffffff", "--color-primary": "#007aff", "--color-secondary": "#34c759", "--color-accent": "#ff9500", "--color-text": "#1d1d1f", "--color-muted": "#86868b", "--color-border": "rgba(0, 0, 0, 0.1)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-spatial', 'system', 'Meaux Spatial', 'meaux-spatial', 'apple', 'Spatial computing theme with depth', '{"css_vars": {"--bg-surface": "#000000", "--bg-panel": "#0a0a0a", "--color-primary": "#0a84ff", "--color-secondary": "#ffffff", "--color-accent": "#30d158", "--color-text": "#ffffff", "--color-muted": "#98989d", "--color-border": "rgba(255, 255, 255, 0.15)", "--radius": "20px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-editor', 'system', 'Meaux Editor', 'meaux-editor', 'developer', 'VS Code-inspired editor theme', '{"css_vars": {"--bg-surface": "#1e1e1e", "--bg-panel": "#252526", "--color-primary": "#007acc", "--color-secondary": "#0098ff", "--color-accent": "#4ec9b0", "--color-text": "#d4d4d4", "--color-muted": "#858585", "--color-border": "rgba(255, 255, 255, 0.1)", "--radius": "4px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-launcher', 'system', 'Meaux Launcher', 'meaux-launcher', 'productivity', 'App launcher theme with vibrant colors', '{"css_vars": {"--bg-surface": "#1c1c1e", "--bg-panel": "#2c2c2e", "--color-primary": "#ff6363", "--color-secondary": "#30d158", "--color-accent": "#0a84ff", "--color-text": "#ffffff", "--color-muted": "#98989d", "--color-border": "rgba(255, 255, 255, 0.15)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-arctic', 'system', 'Meaux Arctic', 'meaux-arctic', 'dark', 'Nord-inspired arctic theme', '{"css_vars": {"--bg-surface": "#2e3440", "--bg-panel": "#3b4252", "--color-primary": "#88c0d0", "--color-secondary": "#81a1c1", "--color-accent": "#5e81ac", "--color-text": "#eceff4", "--color-muted": "#d8dee9", "--color-border": "rgba(216, 222, 233, 0.1)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-vampire', 'system', 'Meaux Vampire', 'meaux-vampire', 'dark', 'Dracula-inspired vampire theme', '{"css_vars": {"--bg-surface": "#282a36", "--bg-panel": "#44475a", "--color-primary": "#bd93f9", "--color-secondary": "#ff79c6", "--color-accent": "#8be9fd", "--color-text": "#f8f8f2", "--color-muted": "#6272a4", "--color-border": "rgba(98, 114, 164, 0.3)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-neon', 'system', 'Meaux Neon', 'meaux-neon', 'dark', 'Tokyo Night-inspired neon theme', '{"css_vars": {"--bg-surface": "#1a1b26", "--bg-panel": "#24283b", "--color-primary": "#7aa2f7", "--color-secondary": "#bb9af7", "--color-accent": "#7dcfff", "--color-text": "#c0caf5", "--color-muted": "#9aa5ce", "--color-border": "rgba(122, 162, 247, 0.2)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-solar', 'system', 'Meaux Solar', 'meaux-solar', 'dark', 'Solarized dark theme', '{"css_vars": {"--bg-surface": "#002b36", "--bg-panel": "#073642", "--color-primary": "#268bd2", "--color-secondary": "#2aa198", "--color-accent": "#859900", "--color-text": "#839496", "--color-muted": "#586e75", "--color-border": "rgba(131, 148, 150, 0.2)", "--radius": "6px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-terminal', 'system', 'Meaux Terminal', 'meaux-terminal', 'developer', 'Classic terminal green theme', '{"css_vars": {"--bg-surface": "#0a0e14", "--bg-panel": "#12171f", "--color-primary": "#00ff00", "--color-secondary": "#33ff33", "--color-accent": "#00cc00", "--color-text": "#00ff00", "--color-muted": "#00aa00", "--color-border": "rgba(0, 255, 0, 0.2)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-minimal', 'system', 'Meaux Minimal', 'meaux-minimal', 'modern', 'Ultra-minimal grayscale theme', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "#fafafa", "--color-primary": "#000000", "--color-secondary": "#666666", "--color-accent": "#999999", "--color-text": "#000000", "--color-muted": "#666666", "--color-border": "rgba(0, 0, 0, 0.1)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- SPECIALTY THEMES
-- ============================================

('theme-meaux-glass-orange', 'system', 'Meaux Glass Orange', 'meaux-glass-orange', 'glass', 'Glassmorphism with orange accent (Inner Animal signature)', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "rgba(255, 255, 255, 0.7)", "--color-primary": "#FF6B00", "--color-secondary": "#339999", "--color-accent": "#00D4FF", "--color-text": "#1a1a1a", "--color-muted": "#666666", "--color-border": "rgba(255, 255, 255, 0.3)", "--radius": "20px", "--glass-blur": "20px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-ops-dark', 'system', 'Meaux Ops Dark', 'meaux-ops-dark', 'operations', 'Operations-focused dark theme', '{"css_vars": {"--bg-surface": "#020617", "--bg-panel": "#0f172a", "--color-primary": "#00D4FF", "--color-secondary": "#0077FF", "--color-accent": "#8b5cf6", "--color-text": "#e2e8f0", "--color-muted": "#94a3b8", "--color-border": "rgba(0, 212, 255, 0.2)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-command', 'system', 'Meaux Command', 'meaux-command', 'developer', 'Command-line inspired dark theme', '{"css_vars": {"--bg-surface": "#0A0E14", "--bg-panel": "#12171F", "--color-primary": "#38BDF8", "--color-secondary": "#0EA5E9", "--color-accent": "#A855F7", "--color-text": "#E6EDF3", "--color-muted": "#8B949E", "--color-border": "rgba(56, 189, 248, 0.2)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- INNER ANIMAL SIGNATURE THEMES
-- ============================================

('theme-inner-animal-light', 'system', 'Inner Animal Light', 'inner-animal-light', 'brand', 'Inner Animal signature light theme', '{"css_vars": {"--bg-surface": "#f8f9fa", "--bg-panel": "#ffffff", "--color-primary": "#2563eb", "--color-secondary": "#7c3aed", "--color-accent": "#ec4899", "--color-text": "#0f172a", "--color-muted": "#64748b", "--color-border": "rgba(0, 0, 0, 0.08)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-inner-animal-dark', 'system', 'Inner Animal Dark', 'inner-animal-dark', 'brand', 'Inner Animal signature dark theme', '{"css_vars": {"--bg-surface": "#0a0e14", "--bg-panel": "#12171f", "--color-primary": "#00D4FF", "--color-secondary": "#7c3aed", "--color-accent": "#ec4899", "--color-text": "#e2e8f0", "--color-muted": "#94a3b8", "--color-border": "rgba(0, 212, 255, 0.2)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-inner-animal-wild', 'system', 'Inner Animal Wild', 'inner-animal-wild', 'brand', 'Bold Inner Animal theme with vibrant colors', '{"css_vars": {"--bg-surface": "#1a1f2e", "--bg-panel": "#242938", "--color-primary": "#ec4899", "--color-secondary": "#f97316", "--color-accent": "#8b5cf6", "--color-text": "#ffffff", "--color-muted": "#a1a1aa", "--color-border": "rgba(236, 72, 153, 0.2)", "--radius": "20px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-inner-animal-zen', 'system', 'Inner Animal Zen', 'inner-animal-zen', 'brand', 'Peaceful Inner Animal theme with calm colors', '{"css_vars": {"--bg-surface": "#ffffff", "--bg-panel": "#fafafa", "--color-primary": "#10b981", "--color-secondary": "#06b6d4", "--color-accent": "#8b5cf6", "--color-text": "#1a1a1a", "--color-muted": "#737373", "--color-border": "rgba(0, 0, 0, 0.08)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-inner-animal-fire', 'system', 'Inner Animal Fire', 'inner-animal-fire', 'brand', 'Fiery Inner Animal theme with warm tones', '{"css_vars": {"--bg-surface": "#1a1614", "--bg-panel": "#2a2420", "--color-primary": "#f97316", "--color-secondary": "#dc2626", "--color-accent": "#fbbf24", "--color-text": "#fef3c7", "--color-muted": "#a0a0a0", "--color-border": "rgba(249, 115, 22, 0.2)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-inner-animal-ocean', 'system', 'Inner Animal Ocean', 'inner-animal-ocean', 'brand', 'Oceanic Inner Animal theme with cool blues', '{"css_vars": {"--bg-surface": "#0a1929", "--bg-panel": "#132f4c", "--color-primary": "#00b4d8", "--color-secondary": "#0077b6", "--color-accent": "#90e0ef", "--color-text": "#e0f2fe", "--color-muted": "#94a3b8", "--color-border": "rgba(0, 180, 216, 0.2)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

-- ============================================
-- CYBER SERIES
-- ============================================

('theme-meaux-cyber-punk', 'system', 'Meaux Cyber Punk', 'meaux-cyber-punk', 'cyber', 'Cyberpunk 2077-inspired theme', '{"css_vars": {"--bg-surface": "#0f0f23", "--bg-panel": "#1a1a2e", "--color-primary": "#ff006e", "--color-secondary": "#00f5ff", "--color-accent": "#ffbe0b", "--color-text": "#ffffff", "--color-muted": "#a0a0b0", "--color-border": "rgba(255, 0, 110, 0.3)", "--radius": "4px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-neon-city', 'system', 'Meaux Neon City', 'meaux-neon-city', 'cyber', 'Neon city lights theme', '{"css_vars": {"--bg-surface": "#0a0a0f", "--bg-panel": "#16161f", "--color-primary": "#ff00ff", "--color-secondary": "#00ffff", "--color-accent": "#ffff00", "--color-text": "#ffffff", "--color-muted": "#9090a0", "--color-border": "rgba(255, 0, 255, 0.3)", "--radius": "8px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-synthwave', 'system', 'Meaux Synthwave', 'meaux-synthwave', 'cyber', 'Synthwave retro-futuristic theme', '{"css_vars": {"--bg-surface": "#2b213a", "--bg-panel": "#241b35", "--color-primary": "#ff00aa", "--color-secondary": "#00d9ff", "--color-accent": "#ffd319", "--color-text": "#ffffff", "--color-muted": "#b8b8c8", "--color-border": "rgba(255, 0, 170, 0.3)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-hacker-green', 'system', 'Meaux Hacker Green', 'meaux-hacker-green', 'cyber', 'Matrix-style hacker green theme', '{"css_vars": {"--bg-surface": "#000000", "--bg-panel": "#0a0f0a", "--color-primary": "#00ff41", "--color-secondary": "#00cc33", "--color-accent": "#39ff14", "--color-text": "#00ff41", "--color-muted": "#00aa2b", "--color-border": "rgba(0, 255, 65, 0.2)", "--radius": "6px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-matrix-rain', 'system', 'Meaux Matrix Rain', 'meaux-matrix-rain', 'cyber', 'Matrix digital rain theme', '{"css_vars": {"--bg-surface": "#000000", "--bg-panel": "#001a00", "--color-primary": "#00ff00", "--color-secondary": "#00dd00", "--color-accent": "#33ff33", "--color-text": "#00ff00", "--color-muted": "#00bb00", "--color-border": "rgba(0, 255, 0, 0.3)", "--radius": "4px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-midnight-blue', 'system', 'Meaux Midnight Blue', 'meaux-midnight-blue', 'cyber', 'Deep midnight blue theme', '{"css_vars": {"--bg-surface": "#0c1445", "--bg-panel": "#1a2456", "--color-primary": "#4d7cfe", "--color-secondary": "#7b68ee", "--color-accent": "#00bfff", "--color-text": "#e0e7ff", "--color-muted": "#9ca3c0", "--color-border": "rgba(77, 124, 254, 0.2)", "--radius": "16px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-sunset-glow', 'system', 'Meaux Sunset Glow', 'meaux-sunset-glow', 'nature', 'Warm sunset glow theme', '{"css_vars": {"--bg-surface": "#1a0f0a", "--bg-panel": "#2a1f1a", "--color-primary": "#ff6b35", "--color-secondary": "#f7931e", "--color-accent": "#ffd60a", "--color-text": "#fff5e6", "--color-muted": "#c0a090", "--color-border": "rgba(255, 107, 53, 0.2)", "--radius": "20px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-forest-deep', 'system', 'Meaux Forest Deep', 'meaux-forest-deep', 'nature', 'Deep forest green theme', '{"css_vars": {"--bg-surface": "#0a1f0f", "--bg-panel": "#1a2f1f", "--color-primary": "#2ecc71", "--color-secondary": "#27ae60", "--color-accent": "#52c41a", "--color-text": "#e8f5e9", "--color-muted": "#90b090", "--color-border": "rgba(46, 204, 113, 0.2)", "--radius": "14px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-desert-sand', 'system', 'Meaux Desert Sand', 'meaux-desert-sand', 'nature', 'Warm desert sand theme', '{"css_vars": {"--bg-surface": "#2a1f15", "--bg-panel": "#3a2f25", "--color-primary": "#d4a574", "--color-secondary": "#c19a6b", "--color-accent": "#f4a460", "--color-text": "#fef5e7", "--color-muted": "#b09070", "--color-border": "rgba(212, 165, 116, 0.2)", "--radius": "18px"}}', 1, 1, unixepoch(), unixepoch()),

('theme-meaux-storm-gray', 'system', 'Meaux Storm Gray', 'meaux-storm-gray', 'modern', 'Stormy gray theme with blue accents', '{"css_vars": {"--bg-surface": "#1c1c1e", "--bg-panel": "#2c2c2e", "--color-primary": "#5ac8fa", "--color-secondary": "#64d2ff", "--color-accent": "#30d5c8", "--color-text": "#f2f2f7", "--color-muted": "#98989d", "--color-border": "rgba(90, 200, 250, 0.2)", "--radius": "12px"}}', 1, 1, unixepoch(), unixepoch());
