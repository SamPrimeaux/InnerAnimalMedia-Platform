#!/bin/bash

echo "🔍 OAuth Setup Verification"
echo "=========================="
echo ""

echo "📦 Database: inneranimalmedia-business (for inneranimalmedia.com)"
echo "------------------------------------------------------------"
wrangler d1 execute inneranimalmedia-business --remote --command="
SELECT 
    id as provider,
    name,
    CASE 
        WHEN client_id = 'PLACEHOLDER_CLIENT_ID' THEN '❌ NOT CONFIGURED'
        ELSE '✅ CONFIGURED'
    END as status,
    SUBSTR(client_id, 1, 30) || '...' as client_id_preview,
    auth_url,
    is_enabled
FROM oauth_providers 
WHERE id IN ('google', 'github')
ORDER BY id;
" 2>&1 | grep -A 20 "results\|provider\|name\|status"

echo ""
echo "📦 Database: meauxos (for meauxcloud.org)"
echo "---------------------------------------"
wrangler d1 execute meauxos --remote --command="
SELECT name FROM sqlite_master WHERE type='table' AND name='oauth_providers';
" 2>&1 | grep -q "oauth_providers" && \
    wrangler d1 execute meauxos --remote --command="
    SELECT 
        id as provider,
        name,
        CASE 
            WHEN client_id = 'PLACEHOLDER_CLIENT_ID' OR client_id IS NULL THEN '❌ NOT CONFIGURED'
            ELSE '✅ CONFIGURED'
        END as status,
        SUBSTR(client_id, 1, 30) || '...' as client_id_preview,
        auth_url,
        is_enabled
    FROM oauth_providers 
    WHERE id IN ('google', 'github')
    ORDER BY id;
    " 2>&1 | grep -A 20 "results\|provider\|name\|status" || \
    echo "⚠️  oauth_providers table not found in meauxos database"

echo ""
echo "✅ Verification Complete"
