# System Dependencies Guide

This document lists all system-level dependencies required for the Intelevo project.

## Overview

The project requires three system-level binaries that cannot be installed via npm:

| Dependency | Purpose | Required For |
|------------|---------|--------------|
| **Pandoc** | DOCX to HTML conversion | Document preview in Activities tab |
| **LibreOffice** | PPTX to PDF/Image conversion | PowerPoint slide preview |
| **Poppler Utils** | PDF operations | PDF to image conversion, PDF info extraction |

## Installation Instructions

### Windows

```powershell
# Using Chocolatey (recommended)
choco install pandoc libreoffice poppler

# Or using winget
winget install --id=JohnMacFarlane.Pandoc
# Download LibreOffice from: https://www.libreoffice.org/download/
# Download Poppler from: https://github.com/oschwartz10612/poppler-windows/releases/
```

### macOS

```bash
# Using Homebrew
brew install pandoc poppler
brew install --cask libreoffice
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install pandoc libreoffice poppler-utils
```

## Verification

After installation, verify each dependency:

```bash
# Check Pandoc
pandoc --version

# Check LibreOffice
soffice --version
# Windows: "C:\Program Files\LibreOffice\program\soffice.exe" --version

# Check Poppler
pdfinfo -v
```

## Automated Check

Run the automated dependency checker:

```bash
npm run check-deps
```

This will verify all system dependencies and report any missing ones.

## What Happens Without These Dependencies?

### Without Pandoc
- ❌ DOCX files cannot be previewed in the Activities tab
- ❌ Document viewer will show errors
- ✅ Other features work normally

### Without LibreOffice
- ❌ PowerPoint (PPTX) files cannot be converted to viewable slides
- ❌ Slide previews will fail
- ✅ Other document types work normally

### Without Poppler Utils
- ❌ PDF to image conversion fails
- ❌ PDF thumbnails cannot be generated
- ❌ Some PDF operations may fail
- ✅ Basic PDF viewing may still work

## For Development Teams

When setting up a new development environment:

1. Clone the repository
2. Install system dependencies (see above)
3. Run `npm install`
4. Run `npm run check-deps` to verify
5. Start development with `npm run dev`

## For Production Deployment

Ensure your production server has these dependencies installed:

**Docker Example:**
```dockerfile
FROM node:18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pandoc \
    libreoffice \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy application files
COPY . /app
WORKDIR /app

# Install npm dependencies
RUN npm install

# Start application
CMD ["npm", "start"]
```

**Render.com / Heroku:**
Add buildpacks or use custom Docker image with these dependencies.

## Troubleshooting

### Pandoc not found
- Ensure Pandoc is in your system PATH
- Windows: Check `C:\Program Files\Pandoc\pandoc.exe` exists
- Try running `pandoc --version` in terminal

### LibreOffice not found
- Ensure LibreOffice is installed
- Windows: Check `C:\Program Files\LibreOffice\program\soffice.exe` exists
- Try running `soffice --version` in terminal

### Poppler not found
- Ensure Poppler utilities are in your system PATH
- Try running `pdfinfo -v` in terminal
- Windows: You may need to manually add Poppler to PATH

## Alternative Solutions

If you cannot install these dependencies:

1. **Use Docker** - All dependencies pre-installed
2. **Use Cloud Services** - Deploy to platforms with these tools
3. **Disable Features** - Comment out conversion code (not recommended)

## Questions?

See the main [README.md](./README.md) for more information or contact the development team.
