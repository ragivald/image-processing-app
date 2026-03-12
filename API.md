# Image Processing API

A powerful API for analyzing images with AI and converting them with EXIF metadata embedding.

## Endpoints

### POST /api/analyze

Analyzes an image using Gemini AI to extract title, description, text (OCR), and generate a URL-friendly handle.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,..." // or just base64 string
}
```

**Response:**
```json
{
  "success": true,
  "title": "Descriptive title",
  "description": "Detailed description of the image",
  "extractedText": "Any text found in the image",
  "handle": "url-friendly-slug"
}
```

**n8n Field Paths:**
- Title: `{{$json.title}}`
- Description: `{{$json.description}}`
- Text: `{{$json.extractedText}}`
- Handle: `{{$json.handle}}`

**cURL for n8n:**
```bash
curl -X POST https://your-domain.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"{{$json.imageBase64}}\"}"
```

**Simple cURL Example:**
```bash
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AAQ..."}'
```

---

### POST /api/convert

Converts an image to a different format and optionally embeds EXIF metadata (JPEG only).

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,...",  // or just base64 string
  "format": "jpeg",                        // jpeg, webp, or png
  "quality": 90,                           // 1-100 (ignored for PNG)
  "metadata": {                            // optional, JPEG only - embeds as EXIF
    "title": "Image title",               // → ImageDescription
    "author": "Photographer Name",        // → Artist
    "copyright": "© 2025 Your Name",      // → Copyright
    "software": "My App v1.0",           // → Software
    "camera": "Canon EOS R5",            // → Model
    "lens": "RF 24-70mm F2.8",           // → LensModel
    "iso": "400",                        // → ISOSpeedRatings
    "focalLength": "50",                 // → FocalLength (mm)
    "aperture": "2.8",                   // → FNumber
    "shutterSpeed": "1/125",             // → ExposureTime
    "gps": {                             // → GPS tags
      "latitude": 40.7128,
      "longitude": -74.0060,
      "altitude": 10
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/jpeg;base64,...",
  "imageBase64": "iVBORw0KGgo...",
  "format": "jpeg",
  "mimeType": "image/jpeg",
  "sizeBytes": 123456,
  "metadata": { ... },
  "exifEmbedded": true
}
```

**n8n Field Paths:**
- Full image (with data URL): `{{$json.image}}`
- Base64 only: `{{$json.imageBase64}}`
- Format: `{{$json.format}}`
- MIME type: `{{$json.mimeType}}`
- Size: `{{$json.sizeBytes}}`

**cURL for n8n:**
```bash
curl -X POST https://your-domain.vercel.app/api/convert \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"{{$json.imageBase64}}\", \"format\": \"jpeg\", \"quality\": 90, \"metadata\": {\"title\": \"{{$json.title}}\", \"author\": \"John Doe\", \"copyright\": \"© 2025\"}}"
```

**Simple cURL Example:**
```bash
curl -X POST https://your-domain.com/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "format": "jpeg",
    "quality": 85,
    "metadata": {
      "title": "Beach Sunset",
      "author": "Jane Smith",
      "copyright": "© 2025 Jane Smith",
      "camera": "Canon EOS R5",
      "lens": "RF 24-70mm F2.8",
      "iso": "400",
      "focalLength": "50",
      "aperture": "2.8"
    }
  }'
```

---

## n8n Workflow Example

Here's how to use these endpoints in an n8n workflow:

### 1. HTTP Request Node - Analyze Image

**Configuration:**
- Method: POST
- URL: `https://your-domain.vercel.app/api/analyze`
- Body Content Type: JSON
- Body: 
```json
{
  "image": "{{$json.imageBase64}}"
}
```

### 2. HTTP Request Node - Convert with Metadata

**Configuration:**
- Method: POST
- URL: `https://your-domain.vercel.app/api/convert`
- Body Content Type: JSON
- Body: 
```json
{
  "image": "{{$json.imageBase64}}",
  "format": "jpeg",
  "quality": 90,
  "metadata": {
    "title": "{{$json.title}}",
    "author": "Your Name",
    "copyright": "© 2025 Your Company",
    "camera": "Canon EOS R5",
    "iso": "400"
  }
}
```

**To reference previous node's data:**
```json
{
  "image": "{{$json.imageBase64}}",
  "format": "jpeg",
  "quality": 90,
  "metadata": {
    "title": "{{$node["Analyze Image"].json["title"]}}",
    "author": "Your Name",
    "copyright": "© 2025 Your Company",
    "software": "My Image App v1.0"
  }
}
```

---

## Combined Workflow

1. Upload an image and analyze it:
```bash
# Step 1: Analyze
curl -X POST https://your-domain.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,..."}'
```

2. Use the analysis results to convert with metadata:
```bash
# Step 2: Convert with metadata from analysis
curl -X POST https://your-domain.com/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,...",
    "format": "jpeg",
    "quality": 90,
    "metadata": {
      "title": "<from $json.title>",
      "author": "<from $json.author>",
      "copyright": "<from $json.copyright>",
      "camera": "<from $json.camera>",
      "lens": "<from $json.lens>",
      "iso": "<from $json.iso>",
      "focalLength": "<from $json.focalLength>",
      "aperture": "<from $json.aperture>",
      "shutterSpeed": "<from $json.shutterSpeed>",
      "gps": {
        "latitude": "<from $json.gps.latitude>",
        "longitude": "<from $json.gps.longitude>",
        "altitude": "<from $json.gps.altitude>"
      }
    }
  }'
```

---

## Features

- **AI-Powered Analysis**: Uses Gemini 3 Pro to analyze images
- **OCR**: Extracts all visible text from images
- **Format Conversion**: JPEG, WebP, PNG support
- **EXIF Metadata Embedding**: Full EXIF support for JPEG (camera, GPS, copyright, etc.)
- **Metadata Preservation**: Keeps existing EXIF when converting WebP/PNG
- **Quality Control**: Adjustable quality settings with MozJPEG compression
- **Base64 Support**: Accepts both data URLs and plain base64 strings
- **n8n Ready**: Flat response structure for easy field access

---

## Environment Variables

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

---

## Notes

- **EXIF metadata embedding is fully supported for JPEG format** with camera info, GPS, copyright, and more
- Existing EXIF data is preserved when converting WebP and PNG formats
- All metadata fields are optional - provide only what you need
- DateTime is automatically added when metadata is provided
- Maximum quality is 100, minimum is 1
- PNG compression level is fixed at 9 (maximum compression)
- Both APIs return flat JSON structures for easy n8n integration
