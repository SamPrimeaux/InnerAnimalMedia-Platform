# Google Drive Integration - Complete ✅

## Implementation Summary

Google Drive integration has been successfully implemented in `src/worker.js`. The integration provides full API access to Google Drive for users who have connected their Google account via OAuth.

## Features Implemented

### 1. OAuth Token Management
- **`getGoogleOAuthToken(env, userId)`**: Retrieves Google OAuth tokens from the database for a user
  - Checks token expiration
  - Automatically refreshes expired tokens if refresh token is available
  - Returns token object with access_token, refresh_token, expires_at, and scope

- **`refreshGoogleToken(env, refreshToken, userId)`**: Refreshes expired Google OAuth tokens
  - Uses OAuth provider config from database or Worker secrets
  - Updates token in database after successful refresh
  - Returns refreshed token object

### 2. Drive API Endpoints (`/api/drive`)

The `handleDrive` function provides the following endpoints:

#### GET /api/drive
- Returns Drive connection info and available endpoints

#### GET /api/drive/files
- List files in a folder (defaults to root)
- Query parameters:
  - `folder_id` (default: 'root')
  - `page_token` (for pagination)
  - `page_size` (default: 100, max: 1000)
  - `q` (search query)
- Returns: List of files with metadata (id, name, mimeType, size, modifiedTime, createdTime, webViewLink, thumbnailLink, parents, shared, starred)

#### GET /api/drive/files/:fileId
- Get file metadata
- Returns: Full file metadata including permissions and description

#### GET /api/drive/files/:fileId/download
- Download file content
- Query parameters:
  - `mimeType` (optional, for Google Workspace files)
- Returns: File content with contentType and size
- Automatically exports Google Docs/Sheets/Slides to plain text/CSV

#### POST /api/drive/files
- Upload file to Google Drive
- Body parameters:
  - `fileName` (required)
  - `fileContent` (required - base64 or string)
  - `mimeType` (default: 'application/octet-stream')
  - `folderId` (default: 'root')
- Returns: Uploaded file metadata

#### POST /api/drive/folders
- Create folder in Google Drive
- Body parameters:
  - `folderName` (required)
  - `parentId` (default: 'root')
- Returns: Created folder metadata

#### DELETE /api/drive/files/:fileId
- Delete file from Google Drive
- Returns: Success message

## Authentication

All Drive API endpoints require:
- User ID (via `user_id` query parameter or `X-User-ID` header)
- Valid Google OAuth token stored in `oauth_tokens` table

If no token is found, endpoints return:
```json
{
  "success": false,
  "error": "Google Drive not connected. Please connect your Google account first.",
  "requires_oauth": true,
  "oauth_url": "/api/oauth/google/authorize?user_id=..."
}
```

## OAuth Setup

Users must connect their Google account via OAuth:
1. Navigate to `/api/oauth/google/authorize?user_id={userId}`
2. Complete Google OAuth flow
3. Token is stored in `oauth_tokens` table with `provider_id='google'`
4. OAuth scope includes: `https://www.googleapis.com/auth/drive.readonly` (already configured in schema)

**Note**: To enable write operations (upload, delete, create folder), update the OAuth scope in `oauth_providers` table to include `https://www.googleapis.com/auth/drive` (full access) instead of `drive.readonly`.

## Integration Status

✅ **Completed**:
- OAuth token retrieval and refresh logic
- List files endpoint
- Get file metadata endpoint
- Download file endpoint (with Google Workspace export support)
- Upload file endpoint
- Create folder endpoint
- Delete file endpoint
- Search files (via `q` query parameter)
- Pagination support
- Error handling and OAuth connection prompts

## Next Steps

1. **Update OAuth Scope**: Change from `drive.readonly` to `drive` for full read/write access
2. **Frontend UI**: Build a Drive file browser UI component (e.g., in `/dashboard/library` or new `/dashboard/drive` page)
3. **File Sync**: Implement file sync functionality to cache Drive files in R2
4. **Tiered Access**: Integrate with tiered SaaS plans to control Drive access by user tier

## Testing

To test the integration:

1. **Connect Google Account**:
   ```
   GET /api/oauth/google/authorize?user_id=your-user-id
   ```

2. **List Files**:
   ```
   GET /api/drive/files?user_id=your-user-id
   ```

3. **Get File**:
   ```
   GET /api/drive/files/{fileId}?user_id=your-user-id
   ```

4. **Upload File**:
   ```
   POST /api/drive/files
   Content-Type: application/json
   {
     "fileName": "test.txt",
     "fileContent": "Hello, World!",
     "mimeType": "text/plain",
     "folderId": "root"
   }
   ```

## Notes

- Tokens are currently stored as-is (not encrypted). TODO: Implement encryption for production.
- Google Workspace files (Docs, Sheets, Slides) are exported as text/CSV when downloading.
- Large file uploads (>5MB) should use resumable upload (not yet implemented).
- Rate limiting should be implemented for production use.
