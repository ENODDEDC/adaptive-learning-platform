# Intelevo

> **Status:** Currently under development  
> **Current Version:** release/2025-08-18-EDC-003 (INVALIDATED)

## About

This is a capstone project system.

## Tech Stack

- **Framework:** Next.js  
- **Database:** MongoDB  
- **Cloud Storage:** Backblaze B2 (primary), Firebase Storage (profile photos only)  

## System Requirements

### Required System Dependencies

Before running this project, you must install the following system-level dependencies:

#### 1. **Pandoc** (Required for DOCX preview)
Pandoc is used to convert DOCX files to HTML for document preview in the Activities tab.

**Installation:**

- **Windows:**
  ```bash
  # Using Chocolatey
  choco install pandoc
  
  # Or using winget
  winget install --id=JohnMacFarlane.Pandoc
  
  # Or download installer from: https://pandoc.org/installing.html
  ```

- **macOS:**
  ```bash
  brew install pandoc
  ```

- **Linux:**
  ```bash
  sudo apt-get install pandoc
  ```

**Verify Installation:**
```bash
pandoc --version
```

#### 2. **LibreOffice** (Required for PowerPoint preview)
LibreOffice is used to convert PowerPoint files (PPTX) to images for slide preview.

**Installation:**

- **Windows:**
  ```bash
  # Download installer from: https://www.libreoffice.org/download/download/
  # Or using Chocolatey
  choco install libreoffice
  ```
  
  Default installation path: `C:\Program Files\LibreOffice\program\soffice.exe`

- **macOS:**
  ```bash
  brew install --cask libreoffice
  ```

- **Linux:**
  ```bash
  sudo apt-get install libreoffice
  ```

**Verify Installation:**
```bash
# Windows (PowerShell)
& "C:\Program Files\LibreOffice\program\soffice.exe" --version

# macOS/Linux
soffice --version
```

#### 3. **Poppler Utils** (Required for PDF operations)
Poppler utilities (pdfinfo, pdftoppm) are used for PDF to image conversion and PDF information extraction.

**Installation:**

- **Windows:**
  ```bash
  # Using Chocolatey
  choco install poppler
  
  # Or download from: https://github.com/oschwartz10612/poppler-windows/releases/
  # Extract and add to PATH
  ```

- **macOS:**
  ```bash
  brew install poppler
  ```

- **Linux:**
  ```bash
  sudo apt-get install poppler-utils
  ```

**Verify Installation:**
```bash
pdfinfo -v
```

### Node.js Dependencies

After installing system dependencies, install Node.js packages:

```bash
npm install
```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Required Environment Variables

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Backblaze B2 (Primary Cloud Storage)
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_KEY_ID=your_backblaze_key_id
B2_APPLICATION_KEY=your_backblaze_application_key
B2_BUCKET_NAME=your_bucket_name

# Firebase (Authentication & Profile Photos)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google AI (for AI features)
GOOGLE_API_KEY=your_google_ai_api_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key
```

### Cloud Storage Configuration

The project uses **Backblaze B2** as the primary cloud storage for:
- Course materials (PDF, DOCX, PPTX files)
- Document thumbnails
- Converted files (PDF conversions)
- User uploads

**Firebase Storage** is only used for:
- Admin profile photos

Make sure your Backblaze B2 bucket is configured with proper CORS settings to allow file access from your application domain.

## Hosting

The project is hosted on [Render](https://render.com).

## Live Demo

Access the live application here: [https://intelevo.onrender.com](https://intelevo.onrender.com)
