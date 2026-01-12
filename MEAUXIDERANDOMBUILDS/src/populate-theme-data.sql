-- Populate theme_data JSON for all themes in the themes table
-- This script generates default theme_data JSON based on theme names
-- Run: wrangler d1 execute inneranimalmedia-business --remote --file=src/populate-theme-data.sql

-- ═══════════════════════════════════════════════════════════════
-- DEFAULT THEME DATA STRUCTURE
-- ═══════════════════════════════════════════════════════════════

-- Base theme data structure
-- This will be customized per theme based on their names/categories

-- ═══════════════════════════════════════════════════════════════
-- STANDARD THEMES (Dark, Light, Simple, etc.)
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#ff6b00',
      'secondary', '#dc2626',
      'dark', '#050507',
      'panel', '#0a0a0f',
      'surface', '#171717'
    ),
    'text', json_object(
      'primary', '#ffffff',
      'secondary', '#a0a0a0',
      'muted', '#666666'
    ),
    'background', json_object(
      'base', '#050507',
      'elevated', '#0a0a0f',
      'overlay', '#171717'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'JetBrains Mono'
  ),
  'spacing', json_object(
    'unit', 8,
    'scale', 1.2
  ),
  'borderRadius', json_object(
    'small', 4,
    'medium', 8,
    'large', 12
  )
) WHERE id IN ('dark', 'dev', 'simple', 'galaxy') AND theme_data IS NULL;

-- Light theme variant
UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#ff6b00',
      'secondary', '#dc2626',
      'light', '#ffffff',
      'panel', '#f5f5f5',
      'surface', '#ffffff'
    ),
    'text', json_object(
      'primary', '#050507',
      'secondary', '#666666',
      'muted', '#a0a0a0'
    ),
    'background', json_object(
      'base', '#ffffff',
      'elevated', '#f5f5f5',
      'overlay', '#ffffff'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'JetBrains Mono'
  ),
  'spacing', json_object(
    'unit', 8,
    'scale', 1.2
  ),
  'borderRadius', json_object(
    'small', 4,
    'medium', 8,
    'large', 12
  )
) WHERE id = 'light' AND theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- CLAY COLLECTION
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#ff6b00',
      'secondary', '#dc2626',
      'light', '#f5f5f5',
      'panel', '#ffffff',
      'surface', '#fafafa'
    ),
    'text', json_object(
      'primary', '#1a1a1a',
      'secondary', '#666666',
      'muted', '#999999'
    ),
    'background', json_object(
      'base', '#ffffff',
      'elevated', '#f5f5f5',
      'overlay', '#ffffff'
    ),
    'shadows', json_object(
      'soft', 'rgba(0,0,0,0.05)',
      'medium', 'rgba(0,0,0,0.1)',
      'strong', 'rgba(0,0,0,0.15)'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'JetBrains Mono'
  ),
  'effects', json_object(
    'claymorphism', true,
    'blur', 10,
    'backdrop', true
  )
) WHERE id IN ('meaux-clay-light', 'meaux-clay-dark') AND theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- APPLE ECOSYSTEM
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#007AFF',
      'secondary', '#5856D6',
      'system', '#000000',
      'panel', '#f2f2f7',
      'surface', '#ffffff'
    ),
    'text', json_object(
      'primary', '#000000',
      'secondary', '#3c3c43',
      'muted', '#8e8e93'
    ),
    'background', json_object(
      'base', '#ffffff',
      'elevated', '#f2f2f7',
      'overlay', '#ffffff'
    )
  ),
  'fonts', json_object(
    'sans', 'SF Pro Display',
    'mono', 'SF Mono'
  ),
  'effects', json_object(
    'ios', true,
    'blur', 20,
    'vibrancy', true
  )
) WHERE id IN ('meaux-ios-light', 'meaux-ios-dark', 'meaux-system') AND theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- DEVELOPER TOOLS
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#58a6ff',
      'secondary', '#f85149',
      'dark', '#0d1117',
      'panel', '#161b22',
      'surface', '#21262d'
    ),
    'text', json_object(
      'primary', '#c9d1d9',
      'secondary', '#8b949e',
      'muted', '#6e7681'
    ),
    'background', json_object(
      'base', '#0d1117',
      'elevated', '#161b22',
      'overlay', '#21262d'
    ),
    'syntax', json_object(
      'keyword', '#ff7b72',
      'string', '#a5d6ff',
      'function', '#d2a8ff',
      'comment', '#8b949e'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'JetBrains Mono'
  ),
  'effects', json_object(
    'codeEditor', true,
    'lineNumbers', true,
    'minimap', true
  )
) WHERE id IN ('meaux-code-dark', 'meaux-editor', 'meaux-browser', 'meaux-design', 'meaux-creative', 'meaux-knowledge') AND theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- INNER ANIMAL SIGNATURE THEMES
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#ff6b00',
      'secondary', '#dc2626',
      'accent', '#ff9500',
      'dark', '#050507',
      'panel', '#0a0a0f',
      'surface', '#171717'
    ),
    'text', json_object(
      'primary', '#ffffff',
      'secondary', '#a0a0a0',
      'muted', '#666666'
    ),
    'background', json_object(
      'base', '#050507',
      'elevated', '#0a0a0f',
      'overlay', '#171717'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'JetBrains Mono'
  ),
  'branding', json_object(
    'innerAnimal', true,
    'signature', true
  )
) WHERE id LIKE 'inner-animal%' AND theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- CYBER SERIES
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#00ff41',
      'secondary', '#ff0080',
      'neon', '#00ffff',
      'dark', '#000000',
      'panel', '#0a0a0a',
      'surface', '#1a1a1a'
    ),
    'text', json_object(
      'primary', '#00ff41',
      'secondary', '#00ffff',
      'muted', '#008080'
    ),
    'background', json_object(
      'base', '#000000',
      'elevated', '#0a0a0a',
      'overlay', '#1a1a1a'
    ),
    'glow', json_object(
      'primary', 'rgba(0,255,65,0.3)',
      'secondary', 'rgba(0,255,255,0.3)',
      'accent', 'rgba(255,0,128,0.3)'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'Courier New'
  ),
  'effects', json_object(
    'cyberpunk', true,
    'glow', true,
    'scanlines', true
  )
) WHERE id IN ('meaux-cyber-punk', 'meaux-neon-city', 'meaux-synthwave', 'meaux-hacker-green', 'meaux-matrix-rain') AND theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- REMAINING THEMES (Generic Modern)
-- ═══════════════════════════════════════════════════════════════

UPDATE themes SET theme_data = json_object(
  'colors', json_object(
    'brand', json_object(
      'primary', '#ff6b00',
      'secondary', '#dc2626',
      'dark', '#050507',
      'panel', '#0a0a0f',
      'surface', '#171717'
    ),
    'text', json_object(
      'primary', '#ffffff',
      'secondary', '#a0a0a0',
      'muted', '#666666'
    ),
    'background', json_object(
      'base', '#050507',
      'elevated', '#0a0a0f',
      'overlay', '#171717'
    )
  ),
  'fonts', json_object(
    'sans', 'Inter',
    'mono', 'JetBrains Mono'
  ),
  'spacing', json_object(
    'unit', 8,
    'scale', 1.2
  ),
  'borderRadius', json_object(
    'small', 4,
    'medium', 8,
    'large', 12
  )
) WHERE theme_data IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'Theme Data Population Complete' as status,
  COUNT(*) as total_themes,
  COUNT(theme_data) as themes_with_data,
  COUNT(*) - COUNT(theme_data) as themes_without_data
FROM themes;
