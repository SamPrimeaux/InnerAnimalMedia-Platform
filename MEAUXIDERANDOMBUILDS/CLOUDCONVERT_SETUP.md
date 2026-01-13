# CloudConvert API Integration

## ✅ Setup Complete

CloudConvert API key has been added to Cloudflare Workers secrets and is ready to use.

## API Key

The CloudConvert API key is stored as a secret in your Cloudflare Worker:
- **Secret Name**: `CLOUDCONVERT_API_KEY`
- **Status**: ✅ Configured

## Usage in Worker

The CloudConvert client is available in `src/cloudconvert-client.js` and can be used for file conversions:

```javascript
import CloudConvertClient from './cloudconvert-client.js';

// In your handler
const cloudconvert = new CloudConvertClient(env.CLOUDCONVERT_API_KEY);

// Convert to GLB
const glbUrl = await cloudconvert.convertToGLB(inputUrl);

// Convert 3D model formats
const outputUrl = await cloudconvert.convert3DModel(inputUrl, 'glb', options);
```

## Supported Conversions

CloudConvert supports:
- **3D Models**: GLB, GLTF, OBJ, FBX, USDZ, STL, PLY
- **Images**: JPG, PNG, WEBP, AVIF, etc.
- **Documents**: PDF, DOCX, HTML, etc.
- **Video**: MP4, WEBM, MOV, etc.

## API Endpoints (To Be Added)

Add to `src/worker.js`:

```javascript
// /api/cloudconvert/convert
if (pathname.startsWith('/api/cloudconvert/convert')) {
  // Handle conversion requests
}
```

## Documentation

- [CloudConvert API Docs](https://cloudconvert.com/api/v2)
- [CloudConvert Formats](https://cloudconvert.com/formats)
