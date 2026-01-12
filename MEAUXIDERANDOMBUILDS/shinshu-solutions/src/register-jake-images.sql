-- Register Jake's uploaded images in asset_metadata table
-- These images are already in R2, we just need to create metadata records

-- Profile Image (vertical portrait)
INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-profile-jake-001',
  'image',
  'jakeoverlookingmtn.jpg',
  'jakeoverlookingmtn.jpg',
  163140,
  'image/jpeg',
  'Jake Waalk - Mountain View',
  'Jake overlooking the mountains - professional portrait for About page',
  'Jake Waalk standing on a mountain overlooking the landscape',
  'Jake Waalk, profile, portrait, mountain, Nagano, Japan',
  'en',
  '{"category": "profile", "location": "Nagano Prefecture", "tags": ["profile", "portrait", "mountain"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Hero Background Image
INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-hero-japan-snow-001',
  'image',
  'japansnow.jpg',
  'japansnow.jpg',
  369090,
  'image/jpeg',
  'Japan Snow Landscape',
  'Beautiful snow-covered landscape in Japan - perfect for hero section',
  'Snow-covered mountain landscape in Japan',
  'Japan, snow, mountains, landscape, Nagano, winter',
  'en',
  '{"category": "hero", "location": "Japan", "tags": ["hero", "landscape", "snow", "winter"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Portfolio Images - Mountain Adventures
INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-portfolio-jake-mountain-001',
  'image',
  'jakemountain.jpg',
  'jakemountain.jpg',
  310330,
  'image/jpeg',
  'Jake on Mountain Summit',
  'Jake on a mountain summit adventure',
  'Jake Waalk on a mountain summit in Japan',
  'Jake Waalk, mountain, summit, hiking, adventure, Japan',
  'en',
  '{"category": "portfolio", "location": "Japan", "tags": ["portfolio", "hiking", "summit", "adventure"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-portfolio-oct-2020-001',
  'image',
  'oct182020jakehike.jpg',
  'oct182020jakehike.jpg',
  111760,
  'image/jpeg',
  'Jake Hiking - October 2020',
  'Jake on a hiking adventure in October 2020',
  'Jake Waalk hiking in the mountains, October 2020',
  'Jake Waalk, hiking, mountain, adventure, October 2020, Japan',
  'en',
  '{"category": "portfolio", "location": "Japan", "date": "2020-10-18", "tags": ["portfolio", "hiking", "adventure"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-portfolio-sept-2021-001',
  'image',
  'september252021-jakemountainpic.jpg',
  'september252021-jakemountainpic.jpg',
  88750,
  'image/jpeg',
  'Jake Mountain Photo - September 2021',
  'Jake mountain photography from September 2021',
  'Jake Waalk mountain photography, September 2021',
  'Jake Waalk, mountain, photography, September 2021, Japan',
  'en',
  '{"category": "portfolio", "location": "Japan", "date": "2021-09-25", "tags": ["portfolio", "mountain", "photography"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-portfolio-march-2023-001',
  'image',
  '3-3-2024.jpg',
  '3-3-2024.jpg',
  874220,
  'image/jpeg',
  'Mountain Adventure - March 2024',
  'Mountain hiking adventure from March 2024',
  'Mountain hiking adventure in Japan, March 2024',
  'mountain, hiking, adventure, March 2024, Japan, Nagano',
  'en',
  '{"category": "portfolio", "location": "Japan", "date": "2024-03-03", "tags": ["portfolio", "hiking", "adventure", "mountain"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

INSERT OR REPLACE INTO asset_metadata (
  id, asset_type, r2_key, file_name, file_size, mime_type,
  title, description, alt_text, keywords,
  language_code, metadata, created_at, updated_at
) VALUES (
  'asset-portfolio-april-2024-001',
  'image',
  '392024.jpg',
  '392024.jpg',
  1280000,
  'image/jpeg',
  'Mountain Adventure - April 2024',
  'Mountain hiking adventure from April 2024',
  'Mountain hiking adventure in Japan, April 2024',
  'mountain, hiking, adventure, April 2024, Japan, Nagano',
  'en',
  '{"category": "portfolio", "location": "Japan", "date": "2024-04-03", "tags": ["portfolio", "hiking", "adventure", "mountain"]}',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);
