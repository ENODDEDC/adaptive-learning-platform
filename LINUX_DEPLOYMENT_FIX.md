# Linux Deployment Fix - Thumbnail Generation

## Problem
The build was failing on Render.com (Linux) with error: "linux is NOT supported" from the `pdf-poppler` package.

## Root Cause
Several npm packages (`pdf-poppler`, `libreoffice-convert`, `pdf2pic`) are Windows-only and were causing build failures when Next.js analyzed the codebase during the build phase on Linux.

## Solution Applied

### 1. Removed Problematic Packages
```bash
npm uninstall pdf-poppler pdf2pic libreoffice-convert
```

### 2. Updated API Routes to Use System Commands
Modified the following routes to use LibreOffice and Poppler system commands instead of npm packages:
- `src/app/api/generate-thumbnail/route.js` - Uses `pdftoppm` and `soffice` commands
- `src/app/api/docx-thumbnail/route.js` - Uses `soffice` command
- `src/app/api/pptx-thumbnail/route.js` - Uses `soffice` command
- `src/app/api/convert-ppt-to-pdf/route.js` - Uses `soffice` command

### 3. Disabled Utility Files
Renamed the following files to `.disabled` to prevent them from being analyzed during build:
- `src/utils/reliablePptConverter.js` → `src/utils/reliablePptConverter.js.disabled`
- `src/utils/pptToPdfConverter.js` → `src/utils/pptToPdfConverter.js.disabled`
- `src/utils/pptConverter.js` → `src/utils/pptConverter.js.disabled`
- `src/app/api/convert-ppt/route.js` → `src/app/api/convert-ppt/route.js.disabled`

### 4. System Dependencies in render.yaml
The `render.yaml` already includes the necessary system packages:
```yaml
buildCommand: "apt-get update && apt-get install -y pandoc libreoffice poppler-utils && npm install && npm run build"
```

## System Commands Used

### PDF Thumbnail Generation
```bash
pdftoppm -png -f 1 -l 1 -scale-to 300 -singlefile "input.pdf" "output"
```

### Document to PDF Conversion
```bash
soffice --headless --convert-to pdf --outdir "output_dir" "input.docx"
```

## Testing
After these changes:
1. Commit and push to GitHub
2. Render.com will automatically deploy
3. The build should complete successfully
4. Thumbnail generation will work using system commands on Linux

## Notes
- The disabled utility files can be re-enabled later if needed for local Windows development
- System commands provide the same functionality as the npm packages
- This approach is more portable and doesn't require platform-specific npm packages
