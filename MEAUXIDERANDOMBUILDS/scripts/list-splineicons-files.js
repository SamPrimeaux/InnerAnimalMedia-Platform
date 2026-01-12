/**
 * Script to list files in splineicons R2 bucket
 * Run with: node scripts/list-splineicons-files.js
 * 
 * Note: This requires Cloudflare R2 API credentials
 * Alternative: Use the worker API endpoint to list files
 */

// This would need to be run in a worker environment
// For now, use the worker's API endpoint:

// Option 1: Create an API endpoint in worker.js
// GET /api/splineicons/list

// Option 2: Use Cloudflare API directly
// https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/splineicons/objects

console.log('To list files in splineicons bucket:');
console.log('1. Deploy worker with SPLINEICONS_STORAGE binding');
console.log('2. Create API endpoint: GET /api/splineicons/list');
console.log('3. Or use Cloudflare API directly with account ID and API token');
