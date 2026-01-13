/**
 * Upload static files to R2 for unified Worker deployment
 * Run: node upload-static-to-r2.js
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// R2 configuration (from wrangler.toml)
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET_NAME = 'inneranimalmedia-assets';

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('Error: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set');
  console.log('\nTo get R2 credentials:');
  console.log('1. Go to Cloudflare Dashboard > R2 > Manage R2 API Tokens');
  console.log('2. Create API token with Object Read & Write permissions');
  console.log('3. Set environment variables:');
  console.log('   export R2_ACCESS_KEY_ID="your-key-id"');
  console.log('   export R2_SECRET_ACCESS_KEY="your-secret-key"');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadFile(localPath, r2Key) {
  try {
    const content = await readFile(localPath);
    const contentType = getContentType(localPath);

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: content,
      ContentType: contentType,
      CacheControl: 'public, max-age=3600',
    }));

    console.log(`✅ Uploaded: ${r2Key}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${r2Key}:`, error.message);
    return false;
  }
}

async function uploadDirectory(dir, baseDir, prefix = 'static') {
  const entries = await readdir(dir, { withFileTypes: true });
  let uploaded = 0;
  let failed = 0;

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip hidden files and node_modules
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    if (entry.isDirectory()) {
      const subUploaded = await uploadDirectory(fullPath, baseDir, prefix);
      uploaded += subUploaded.uploaded;
      failed += subUploaded.failed;
    } else if (entry.isFile()) {
      const relativePath = relative(baseDir, fullPath);
      const r2Key = `${prefix}/${relativePath.replace(/\\/g, '/')}`;

      if (await uploadFile(fullPath, r2Key)) {
        uploaded++;
      } else {
        failed++;
      }
    }
  }

  return { uploaded, failed };
}

function getContentType(path) {
  const ext = path.split('.').pop().toLowerCase();
  const types = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
  };
  return types[ext] || 'application/octet-stream';
}

async function main() {
  console.log('🚀 Uploading static files to R2...\n');

  const rootDir = __dirname;
  const dirsToUpload = [
    'dashboard',
    'shared',
  ];
  const filesToUpload = [
    'index.html',
  ];

  let totalUploaded = 0;
  let totalFailed = 0;

  // Upload root files
  for (const file of filesToUpload) {
    const localPath = join(rootDir, file);
    try {
      await stat(localPath);
      if (await uploadFile(localPath, `static/${file}`)) {
        totalUploaded++;
      } else {
        totalFailed++;
      }
    } catch (error) {
      console.log(`⚠️  Skipping ${file} (not found)`);
    }
  }

  // Upload directories
  for (const dir of dirsToUpload) {
    const localPath = join(rootDir, dir);
    try {
      await stat(localPath);
      const result = await uploadDirectory(localPath, rootDir);
      totalUploaded += result.uploaded;
      totalFailed += result.failed;
    } catch (error) {
      console.log(`⚠️  Skipping ${dir} (not found)`);
    }
  }

  console.log(`\n✨ Upload complete!`);
  console.log(`   ✅ Uploaded: ${totalUploaded} files`);
  if (totalFailed > 0) {
    console.log(`   ❌ Failed: ${totalFailed} files`);
  }
  console.log(`\n📦 Files are now available at: static/* in R2 bucket "${BUCKET_NAME}"`);
}

main().catch(console.error);
