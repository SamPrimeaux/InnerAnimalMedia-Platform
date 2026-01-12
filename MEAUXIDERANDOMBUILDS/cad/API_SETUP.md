# MeauxCAD API Setup Guide

## Overview
MeauxCAD integrates with Google AI (Gemini) and CloudConvert for AI-powered design assistance and professional export functionality.

## API Key Configuration

### 1. Google AI API (Gemini)

**Purpose:** AI-powered CAD design assistance, shape generation, and intelligent design suggestions.

**Setup:**
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set it as a Cloudflare Workers secret:
   ```bash
   cd cad
   wrangler secret put GOOGLE_AI_API_KEY
   # Paste your API key when prompted
   ```

**Usage:**
- AI Assistant panel in the CAD interface
- Natural language to CAD command conversion
- Design optimization suggestions
- Pattern generation

### 2. CloudConvert API

**Purpose:** Professional CAD format conversion (STL, OBJ, STEP, IGES, FBX, etc.)

**Setup:**
1. Sign up at [CloudConvert](https://cloudconvert.com/)
2. Get your API key from the dashboard
3. Set it as a Cloudflare Workers secret:
   ```bash
   cd cad
   wrangler secret put CLOUDCONVERT_API_KEY
   # Paste your API key when prompted
   ```

**Supported Export Formats:**
- **2D:** SVG, PNG, PDF, DXF, DWG
- **3D:** STL, OBJ, GLB, GLTF, STEP, IGES, FBX, 3DS

## API Endpoints

### Check API Status
```bash
GET /api/status
```
Returns configuration status of both APIs.

### AI Generation
```bash
POST /api/ai/generate
Content-Type: application/json

{
  "prompt": "Create a 100x50mm rectangle",
  "context": "Optional context about current design"
}
```

### Export Conversion
```bash
POST /api/export
Content-Type: application/json

{
  "inputFormat": "svg",
  "outputFormat": "stl",
  "fileData": "base64_encoded_file_data",
  "fileName": "my-design.svg"
}
```

## Testing

After setting up API keys, test the configuration:

```bash
curl https://meauxcad.meauxbility.workers.dev/api/status
```

Expected response:
```json
{
  "googleAI": "configured",
  "cloudConvert": "configured"
}
```

## Usage in CAD Interface

1. **AI Assistant:** Click the "AI Assistant" button in the top toolbar
2. **Ask for designs:** Type natural language requests like:
   - "Create a 50x30mm rectangle"
   - "Draw a circle with radius 25"
   - "Generate a grid pattern"
3. **Export:** Use the Export button to convert to professional CAD formats

## Troubleshooting

- **"API key not configured"**: Make sure you've set the secrets using `wrangler secret put`
- **"Failed to connect"**: Check your API keys are valid and have proper permissions
- **Export fails**: Ensure CloudConvert API key has sufficient credits/quota

## Next Steps

1. Set both API keys using `wrangler secret put`
2. Redeploy the worker: `wrangler deploy`
3. Test the AI assistant in the CAD interface
4. Try exporting to different formats