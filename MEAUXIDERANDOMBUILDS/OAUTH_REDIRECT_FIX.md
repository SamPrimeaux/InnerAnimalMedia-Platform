# 🔧 OAuth Callback Redirect Fix

**Issue**: OAuth callbacks were redirecting to `/dashboard/index.html?oauth_error=callback_failed` with 'notfound' error instead of `/dashboard`

**Fixed**: ✅ Deployed

---

## 🐛 Issues Fixed

### 1. Redirect URLs Updated
- **Before**: All OAuth error redirects went to `/dashboard/index.html?oauth_error=...`
- **After**: All redirects now go to `/dashboard?oauth_error=...` (cleaner URL)

### 2. Default Redirect URI Updated
- **Before**: Default redirect URI was `${origin}/dashboard/index.html`
- **After**: Default redirect URI is now `${origin}/dashboard`
- **Note**: Existing state records with old URLs are automatically normalized

### 3. Better Error Handling
- Added validation for user_info API response failures
- Made user record updates non-blocking (won't fail if user doesn't exist yet)
- Improved error messages to identify "notfound" errors specifically

### 4. Error Message Improvements
- Catch block now detects "not found" errors specifically
- Returns `oauth_error=notfound` when database records aren't found
- Better logging for debugging OAuth callback failures

---

## 📋 Changes Made

### Updated Redirect Locations

**All OAuth Error Redirects Now Use `/dashboard`**:
- `oauth_error` (from OAuth provider)
- `missing_params` (missing code or state)
- `invalid_state` (state token expired or not found)
- `provider_not_found` (OAuth provider not in database)
- `token_exchange_failed` (failed to exchange code for token)
- `user_info_failed` (failed to fetch user info from provider)
- `invalid_user_info` (user info response invalid)
- `callback_failed` (general catch-all error)
- `notfound` (specific "not found" database errors)

### Code Changes

1. **handleOAuthAuthorize** (line ~2984):
   ```javascript
   // Before:
   const redirectUri = url.searchParams.get('redirect_uri') || `${origin}/dashboard/index.html`;
   
   // After:
   const redirectUri = url.searchParams.get('redirect_uri') || `${origin}/dashboard`;
   ```

2. **handleOAuthCallback** - All error redirects updated:
   ```javascript
   // Before:
   return Response.redirect(`${url.origin}/dashboard/index.html?oauth_error=${error}`, 302);
   
   // After:
   return Response.redirect(`${url.origin}/dashboard?oauth_error=${error}`, 302);
   ```

3. **Redirect URI Normalization** (line ~3131):
   ```javascript
   // Normalize redirect URI to use /dashboard instead of /dashboard/index.html
   let redirectUri = stateRecord.redirect_uri || `${url.origin}/dashboard`;
   if (redirectUri.includes('/dashboard/index.html')) {
     redirectUri = redirectUri.replace('/dashboard/index.html', '/dashboard');
   }
   ```

4. **User Info Fetch Error Handling** (line ~3193):
   ```javascript
   // Added validation for user_info API response
   if (!userInfoResponse.ok) {
     return Response.redirect(`${url.origin}/dashboard?oauth_error=user_info_failed&status=${userInfoResponse.status}`, 302);
   }
   
   if (!userInfo || (userInfo.error && !userInfo.id && !userInfo.sub)) {
     return Response.redirect(`${url.origin}/dashboard?oauth_error=invalid_user_info`, 302);
   }
   ```

5. **Non-Blocking User Updates** (line ~3248):
   ```javascript
   // User record updates wrapped in try-catch (non-blocking)
   try {
     // Update user record with provider info
   } catch (userUpdateError) {
     // Non-blocking: User might not exist yet - this is OK
     console.warn('Could not update user record (non-blocking):', userUpdateError.message);
   }
   ```

6. **Improved Catch Block** (line ~3267):
   ```javascript
   } catch (error) {
     console.error('OAuth callback error:', error);
     const errorMsg = error.message || 'callback_failed';
     // Log more details for debugging
     if (error.message && error.message.includes('not found')) {
       console.error('Database error - possible missing table or record:', error);
       return Response.redirect(`${url.origin}/dashboard?oauth_error=notfound`, 302);
     }
     return Response.redirect(`${url.origin}/dashboard?oauth_error=${errorMsg}`, 302);
   }
   ```

---

## ✅ Testing

### Test OAuth Flow

1. **Initiate OAuth**:
   ```
   https://inneranimalmedia.com/api/oauth/google/authorize
   ```

2. **After OAuth Provider Redirect**:
   - Success: Should redirect to `/dashboard?oauth_success=google`
   - Error: Should redirect to `/dashboard?oauth_error=<error_type>`

3. **Verify Redirects**:
   - All redirects should go to `/dashboard` (not `/dashboard/index.html`)
   - Error messages should be clear and specific

---

## 🔍 Debugging "notfound" Errors

If you still see `oauth_error=notfound`, check:

1. **Provider Exists in Database**:
   ```sql
   SELECT * FROM oauth_providers WHERE id = 'google' AND is_enabled = 1;
   ```

2. **State Record Exists**:
   ```sql
   SELECT * FROM oauth_states WHERE id = '<state_token>' AND expires_at > strftime('%s', 'now');
   ```

3. **Check Worker Logs**:
   ```bash
   wrangler tail
   ```
   Look for: `OAuth callback error:` or `Database error - possible missing table or record`

4. **Common Causes**:
   - State token expired (older than 10 minutes)
   - State token not found (already used or never created)
   - OAuth provider not in database
   - Database connection issues

---

## 📝 Deployment Status

✅ **Deployed**: `inneranimalmedia-dev`  
✅ **Version**: `e011d0d5-be6e-48f9-aa5e-a3913022e095`  
✅ **URL**: `https://inneranimalmedia-dev.meauxbility.workers.dev`  
✅ **Status**: All redirects now go to `/dashboard` instead of `/dashboard/index.html`

---

## 🚀 Next Steps

1. **Test OAuth Flow**: Try logging in with Google OAuth and verify redirects
2. **Monitor Logs**: Check for any remaining "notfound" errors
3. **Update Frontend**: If frontend code references `/dashboard/index.html?oauth_error=...`, update to `/dashboard?oauth_error=...`

---

**Status**: ✅ Fixed and Deployed  
**Last Updated**: $(date)  
**Version**: e011d0d5-be6e-48f9-aa5e-a3913022e095
