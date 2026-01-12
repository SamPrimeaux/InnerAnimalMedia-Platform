# Durable Objects: KV vs SQLite-Backed Explained

## The Difference

### KV-Backed Durable Objects (Old/Current Issue)
- **Storage**: Uses Cloudflare KV (key-value store)
- **Speed**: Faster reads/writes
- **Limitations**: 
  - ❌ No Data Studio access
  - ❌ No SQL queries
  - ❌ Limited to key-value operations
  - ❌ Harder to debug/query

### SQLite-Backed Durable Objects (Optimal Setup)
- **Storage**: Uses SQLite database
- **Speed**: Slightly slower, but still very fast
- **Benefits**:
  - ✅ **Data Studio access** - Query and visualize data
  - ✅ SQL queries - Full SQL support
  - ✅ Better debugging - See actual data structure
  - ✅ More flexible - Complex queries, joins, etc.

## Your Current Issue

**Dashboard shows**: `inneranimalmedia-dev_MeauxSession` (KV-backed) ❌
**Your code uses**: `IAMSession` (SQLite-backed) ✅
**Binding mismatch**: Dashboard shows `SESSION_DO`, but code uses `IAM_SESSION`

## The Fix

1. **Update binding name** in Cloudflare Dashboard to match `wrangler.toml`
2. **Complete migration** from `MeauxSession` (KV) to `IAMSession` (SQLite)
3. **Remove old KV namespace** after migration

## Hyperdrive (Separate from Durable Objects)

**Hyperdrive** = PostgreSQL connection pooling for Supabase
- ✅ Already configured correctly in `wrangler.toml`
- ✅ Binding: `HYPERDRIVE`
- ✅ ID: `9108dd6499bb44c286e4eb298c6ffafb`
- ✅ Name: `meauxhyper`

**This is separate** from Durable Objects - it's for connecting to your Supabase PostgreSQL database.
