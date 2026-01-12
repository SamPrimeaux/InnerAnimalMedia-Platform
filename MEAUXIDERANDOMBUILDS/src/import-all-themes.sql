-- Import All Meaux Themes to Database
-- 46 themes total: 6 existing + 40 new from theme library
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/import-all-themes.sql

-- ═══════════════════════════════════════════════════════════════
-- CLAY COLLECTION
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-clay-light', 'meaux-clay-light', 'Meaux Clay Light', 'Light claymorphic theme with soft shadows', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-clay-dark', 'meaux-clay-dark', 'Meaux Clay Dark', 'Dark claymorphic theme with depth', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- PREMIUM MODERN
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-monochrome', 'meaux-monochrome', 'Meaux Monochrome', 'Pure black and white minimal theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-workflow', 'meaux-workflow', 'Meaux Workflow', 'Optimized for workflow management', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-productivity', 'meaux-productivity', 'Meaux Productivity', 'Bright productivity-focused theme', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- APPLE ECOSYSTEM
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-ios-light', 'meaux-ios-light', 'Meaux iOS Light', 'Apple iOS light theme aesthetic', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-ios-dark', 'meaux-ios-dark', 'Meaux iOS Dark', 'Apple iOS dark theme aesthetic', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- DEVELOPER TOOLS
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-code-dark', 'meaux-code-dark', 'Meaux Code Dark', 'GitHub-inspired dark code editor theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-browser', 'meaux-browser', 'Meaux Browser', 'Modern browser-inspired theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-design', 'meaux-design', 'Meaux Design', 'Creative design tool aesthetic', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-creative', 'meaux-creative', 'Meaux Creative', 'Vibrant creative workspace theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-knowledge', 'meaux-knowledge', 'Meaux Knowledge', 'Knowledge management focused theme', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- EXTENDED COLLECTION
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-adaptive', 'meaux-adaptive', 'Meaux Adaptive', 'Material Design inspired adaptive theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-workspace', 'meaux-workspace', 'Meaux Workspace', 'Slack-inspired workspace theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-music', 'meaux-music', 'Meaux Music', 'Spotify-inspired music theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-system', 'meaux-system', 'Meaux System', 'Apple system theme inspired', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-spatial', 'meaux-spatial', 'Meaux Spatial', 'Vision Pro spatial computing theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-editor', 'meaux-editor', 'Meaux Editor', 'VS Code-inspired editor theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-launcher', 'meaux-launcher', 'Meaux Launcher', 'Raycast/Alfred-inspired launcher theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-arctic', 'meaux-arctic', 'Meaux Arctic', 'Nord color scheme inspired', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-vampire', 'meaux-vampire', 'Meaux Vampire', 'Dracula color scheme inspired', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-neon', 'meaux-neon', 'Meaux Neon', 'Tokyo Night color scheme inspired', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-solar', 'meaux-solar', 'Meaux Solar', 'Solarized color scheme inspired', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-terminal', 'meaux-terminal', 'Meaux Terminal', 'Terminal green on black aesthetic', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-minimal', 'meaux-minimal', 'Meaux Minimal', 'Ultra minimal clean theme', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- SPECIALTY THEMES
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-glass-orange', 'meaux-glass-orange', 'Meaux Glass Orange', 'Glassmorphic orange theme with blur', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-ops-dark', 'meaux-ops-dark', 'Meaux Ops Dark', 'Operations dark theme with cyan accents', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-command', 'meaux-command', 'Meaux Command', 'Command line inspired theme', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- INNER ANIMAL SIGNATURE THEMES
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('inner-animal-light', 'inner-animal-light', 'Inner Animal Light', 'InnerAnimal Media light signature theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('inner-animal-dark', 'inner-animal-dark', 'Inner Animal Dark', 'InnerAnimal Media dark signature theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('inner-animal-wild', 'inner-animal-wild', 'Inner Animal Wild', 'Wild vibrant InnerAnimal theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('inner-animal-zen', 'inner-animal-zen', 'Inner Animal Zen', 'Calm zen InnerAnimal theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('inner-animal-fire', 'inner-animal-fire', 'Inner Animal Fire', 'Fiery orange InnerAnimal theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('inner-animal-ocean', 'inner-animal-ocean', 'Inner Animal Ocean', 'Ocean blue InnerAnimal theme', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- ═══════════════════════════════════════════════════════════════
-- CYBER SERIES
-- ═══════════════════════════════════════════════════════════════

INSERT OR REPLACE INTO themes (id, name, display_name, description, is_custom, created_at, updated_at)
VALUES 
('meaux-cyber-punk', 'meaux-cyber-punk', 'Meaux Cyber Punk', 'Cyberpunk 2077 inspired theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-neon-city', 'meaux-neon-city', 'Meaux Neon City', 'Neon city night aesthetic', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-synthwave', 'meaux-synthwave', 'Meaux Synthwave', '80s synthwave retro theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-hacker-green', 'meaux-hacker-green', 'Meaux Hacker Green', 'Classic hacker green terminal', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-matrix-rain', 'meaux-matrix-rain', 'Meaux Matrix Rain', 'The Matrix green code rain', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-midnight-blue', 'meaux-midnight-blue', 'Meaux Midnight Blue', 'Deep midnight blue theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-sunset-glow', 'meaux-sunset-glow', 'Meaux Sunset Glow', 'Warm sunset orange theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-forest-deep', 'meaux-forest-deep', 'Meaux Forest Deep', 'Deep forest green theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-desert-sand', 'meaux-desert-sand', 'Meaux Desert Sand', 'Warm desert sand theme', 0, strftime('%s', 'now'), strftime('%s', 'now')),
('meaux-storm-gray', 'meaux-storm-gray', 'Meaux Storm Gray', 'Stormy gray with cyan accents', 0, strftime('%s', 'now'), strftime('%s', 'now'));

-- Output success message
SELECT 'All 46 themes imported successfully!' as status, COUNT(*) as total_themes FROM themes;
