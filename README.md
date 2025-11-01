<div align="center">

# 🎓 Intelevo

### AI-Powered Assistive Learning Platform

[![Status](https://img.shields.io/badge/status-in%20development-yellow)](https://github.com/yourusername/intelevo)
[![Version](https://img.shields.io/badge/version-release%2F2025--08--18--EDC--003-blue)](https://github.com/yourusername/intelevo)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://intelevo.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

[Live Demo](https://intelevo.onrender.com) • [Documentation](SYSTEM_DEPENDENCIES.md) • [Report Bug](https://github.com/yourusername/intelevo/issues)

</div>

---

## 📖 About

Intelevo is an intelligent learning management system that leverages AI to provide personalized educational experiences. Built as a capstone project, it features advanced document processing, multiple AI-powered learning modes, and comprehensive course management capabilities.

### ✨ Key Features

- 🤖 **8 AI Learning Modes** - Personalized learning experiences (AI Narrator, Visual Learning, Sequential, Global, Hands-On Lab, Concept Constellation, Active Learning, Reflective Learning)
- 📄 **Smart Document Processing** - Preview and interact with PDF, DOCX, and PPTX files
- 🎯 **Intelligent Course Management** - Create, organize, and track educational content
- 💬 **Real-time Collaboration** - Interactive classwork and assignment submission
- 🔐 **Secure Authentication** - Firebase-powered user management
- ☁️ **Cloud Storage** - Efficient file management with Backblaze B2

## 🛠️ Tech Stack

<table>
<tr>
<td>

**Frontend**
- Next.js 15
- React 19
- TailwindCSS
- Heroicons

</td>
<td>

**Backend**
- Node.js
- MongoDB
- Mongoose
- JWT Auth

</td>
<td>

**AI & Services**
- Google Generative AI
- Firebase Auth
- Backblaze B2
- Pandoc, LibreOffice

</td>
</tr>
</table>  

## 🚀 Getting Started

### Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Python** 3.8 or higher (for ML service)

### System Dependencies

The following system-level binaries are required for document processing:

<details>
<summary><b>📦 1. Pandoc</b> - DOCX to HTML conversion</summary>

<br>

**Purpose:** Converts DOCX files to HTML for document preview

**Installation:**

```bash
# Windows (Chocolatey)
choco install pandoc

# Windows (winget)
winget install --id=JohnMacFarlane.Pandoc

# macOS
brew install pandoc

# Linux
sudo apt-get install pandoc
```

**Verify:**
```bash
pandoc --version
```

📚 [Installation Guide](https://pandoc.org/installing.html)

</details>

<details>
<summary><b>📊 2. LibreOffice</b> - PowerPoint conversion</summary>

<br>

**Purpose:** Converts PPTX files to PDF/images for slide preview

**Installation:**

```bash
# Windows (Chocolatey)
choco install libreoffice

# macOS
brew install --cask libreoffice

# Linux
sudo apt-get install libreoffice
```

**Default Path (Windows):** `C:\Program Files\LibreOffice\program\soffice.exe`

**Verify:**
```bash
# Windows
& "C:\Program Files\LibreOffice\program\soffice.exe" --version

# macOS/Linux
soffice --version
```

📚 [Download LibreOffice](https://www.libreoffice.org/download/download/)

</details>

<details>
<summary><b>📄 3. Poppler Utils</b> - PDF operations</summary>

<br>

**Purpose:** PDF to image conversion and metadata extraction

**Installation:**

```bash
# Windows (Chocolatey)
choco install poppler

# macOS
brew install poppler

# Linux
sudo apt-get install poppler-utils
```

**Verify:**
```bash
pdfinfo -v
```

📚 [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases/)

</details>

### 📥 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/intelevo.git
   cd intelevo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify system dependencies**
   ```bash
   npm run check-deps
   ```

4. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
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

5. **Set up ML service** (for learning style classification)
   ```bash
   # Run the automated setup script
   scripts\setup-ml.bat
   
   # This will:
   # - Create a Python virtual environment
   # - Install required ML packages
   # - Verify trained models are present
   ```

6. **Run the complete system**
   
   **Option A: Quick Start (Recommended)**
   ```bash
   # Starts everything automatically (MongoDB, Next.js, ML Service)
   .\start-all.bat
   ```
   This will open two terminal windows and start all services automatically.
   
   **Option B: Manual Start**
   ```bash
   # Terminal 1: Start Next.js app
   npm run dev
   
   # Terminal 2: Start ML service
   scripts\start-ml-service.bat
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## ☁️ Cloud Storage

### Backblaze B2 (Primary)
Used for:
- 📚 Course materials (PDF, DOCX, PPTX)
- 🖼️ Document thumbnails
- 🔄 Converted files
- 📤 User uploads

**Configuration:** Ensure your Backblaze B2 bucket has proper CORS settings for your application domain.

### Firebase Storage (Secondary)
Used for:
- 👤 Admin profile photos only

## 📜 Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run check-deps   # Verify system dependencies
```

### ML Service
```bash
scripts\setup-ml.bat       # Setup Python environment & dependencies
scripts\start-ml-service.bat   # Start ML classification service (port 5000)
```

### Quick Start (All Services)
```bash
.\start-all.bat            # Start MongoDB + Next.js + ML Service automatically
```

**Note:** The ML service must be running for learning style classification features to work. Trained models are included in the repository, so no training is required for new team members.

## 🏗️ Project Structure

```
intelevo/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── courses/      # Course pages
│   │   └── ...
│   ├── components/       # React components
│   ├── services/         # Business logic & external services
│   ├── models/           # MongoDB models
│   ├── config/           # Configuration files
│   └── utils/            # Utility functions
├── ml-service/           # Machine Learning service
│   ├── models/           # Trained XGBoost models (included)
│   ├── training/         # Training scripts
│   ├── data/             # Training data
│   └── app.py            # Flask API server
├── public/               # Static assets
├── scripts/              # Build & utility scripts
└── ...
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🌐 Deployment

The project is deployed on [Render](https://render.com).

**Live Demo:** [https://intelevo.onrender.com](https://intelevo.onrender.com)

## 📞 Support

For detailed system dependency information, see [SYSTEM_DEPENDENCIES.md](SYSTEM_DEPENDENCIES.md)

For issues and questions, please [open an issue](https://github.com/yourusername/intelevo/issues).

---

<div align="center">

[⬆ Back to Top](#-intelevo)

</div>
