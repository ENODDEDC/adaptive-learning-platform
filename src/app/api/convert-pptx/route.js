import { NextResponse } from 'next/server';
import path from 'path';
import { execFile } from 'child_process';
import fs from 'fs/promises';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

  try {
    // Check if file exists
    await fs.access(absolutePath);

    // Check if LibreOffice is available
    let libreOfficeAvailable = false;
    let libreOfficePath = 'libreoffice'; // Default path
    
    // Check common Windows LibreOffice paths
    const possiblePaths = [
      'libreoffice', // If in PATH
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
    ];
    
    for (const path of possiblePaths) {
      try {
        await new Promise((resolve, reject) => {
          execFile(path, ['--version'], (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve({ stdout, stderr });
            }
          });
        });
        libreOfficeAvailable = true;
        libreOfficePath = path;
        console.log('LibreOffice found at:', path);
        break;
      } catch (error) {
        // Try next path
        continue;
      }
    }
    
    if (!libreOfficeAvailable) {
      console.warn('LibreOffice not available in any common location');
    }

    if (!libreOfficeAvailable) {
      // Return a fallback HTML with download option
      const fallbackHtml = generateFallbackHtml(absolutePath);
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Try conversion, but if it fails, fall back to the fallback HTML
    try {
      // Create temporary directory for conversion
      const tempDir = path.join(process.cwd(), 'temp', `pptx_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Convert PPTX to HTML using LibreOffice
      const args = [
        '--headless',
        '--invisible',
        '--nodefault',
        '--nolockcheck',
        '--nologo',
        '--norestore',
        '--convert-to', 'html',
        '--outdir', tempDir,
        absolutePath
      ];

      const { stdout, stderr } = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('LibreOffice conversion timeout'));
        }, 30000); // 30 second timeout
        
        execFile(libreOfficePath, args, { 
          maxBuffer: 50 * 1024 * 1024,
          timeout: 30000
        }, (error, stdout, stderr) => {
          clearTimeout(timeout);
          if (error) {
            error.stderr = stderr;
            return reject(error);
          }
          resolve({ stdout, stderr });
        });
      });

      if (stderr) {
        console.warn('LibreOffice stderr:', stderr);
      }

      // Find the generated HTML file
      const files = await fs.readdir(tempDir);
      console.log('Files generated in temp directory:', files);
      const htmlFile = files.find(file => file.endsWith('.html'));
      
      if (!htmlFile) {
        console.error('No HTML file found. Available files:', files);
        throw new Error('No HTML file generated from PowerPoint conversion');
      }

      const htmlPath = path.join(tempDir, htmlFile);
      const htmlContent = await fs.readFile(htmlPath, 'utf8');

      // Clean up temporary files
      await fs.rm(tempDir, { recursive: true, force: true });

      // Process HTML to extract slide information and improve structure
      const processedHtml = processPowerPointHtml(htmlContent);
      
      return new NextResponse(processedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    } catch (conversionError) {
      console.warn('LibreOffice conversion failed, using fallback:', conversionError.message);
      // Clean up temp directory on error
      try {
        const tempDir = path.join(process.cwd(), 'temp', `pptx_${Date.now()}`);
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('Error cleaning up temp directory:', cleanupError);
      }
      
      // Return fallback HTML
      const fallbackHtml = generateFallbackHtml(absolutePath);
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

  } catch (error) {
    console.error('Error converting PPTX to HTML with LibreOffice:', error);
    console.error('Error details:', {
      message: error.message,
      stderr: error.stderr,
      code: error.code,
      signal: error.signal
    });
    
    // Clean up temp directory on error
    try {
      const tempDir = path.join(process.cwd(), 'temp', `pptx_${Date.now()}`);
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn('Error cleaning up temp directory:', cleanupError);
    }

    // Return fallback HTML instead of error
    const fallbackHtml = generateFallbackHtml(absolutePath);
    return new NextResponse(fallbackHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

function processPowerPointHtml(htmlContent) {
  // Simple processing for server-side - just return the HTML with basic styling
  // More advanced processing can be done client-side
  return `
    <div class="presentation-container" data-total-slides="1">
      <div class="slide" data-slide="1">
        <div class="slide-content">
          ${htmlContent}
        </div>
      </div>
    </div>
  `;
}

function generateFallbackHtml(filePath) {
  const fileName = path.basename(filePath);
  const fileUrl = filePath.replace(process.cwd() + '/public', '');
  
  return `
    <div class="presentation-container" data-total-slides="1">
      <div class="slide" data-slide="1">
        <div class="slide-content">
          <h1>PowerPoint Presentation</h1>
          <h2>${fileName}</h2>
          <div style="margin: 2rem 0; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 8px;">
            <p style="font-size: 1.2rem; margin-bottom: 1.5rem;">
              LibreOffice is not installed on this server. To enable PowerPoint preview functionality, please install LibreOffice.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="${fileUrl}" download class="btn-download" style="
                display: inline-block;
                padding: 12px 24px;
                background: #3b82f6;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                transition: background-color 0.2s;
              " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
                Download PowerPoint
              </a>
              <a href="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent('http://localhost:3000' + fileUrl)}" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 class="btn-view-online" 
                 style="
                   display: inline-block;
                   padding: 12px 24px;
                   background: #10b981;
                   color: white;
                   text-decoration: none;
                   border-radius: 6px;
                   font-weight: 500;
                   transition: background-color 0.2s;
                 " 
                 onmouseover="this.style.backgroundColor='#059669'" 
                 onmouseout="this.style.backgroundColor='#10b981'">
                View Online
              </a>
            </div>
          </div>
          <div style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.8;">
            <p><strong>Installation Instructions:</strong></p>
            <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
              <li>Download LibreOffice from <a href="https://www.libreoffice.org/download/" target="_blank" style="color: #93c5fd;">libreoffice.org</a></li>
              <li>Install LibreOffice on your server</li>
              <li>Ensure the 'libreoffice' command is available in your system PATH</li>
              <li>Restart your application server</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <style>
      .presentation-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
      }
      
      .slide {
        min-height: 100vh;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        position: relative;
      }
      
      .slide h1, .slide h2, .slide h3 {
        margin-bottom: 1rem;
        font-weight: bold;
      }
      
      .slide h1 {
        font-size: 3rem;
        margin-bottom: 2rem;
      }
      
      .slide h2 {
        font-size: 2.5rem;
      }
      
      .slide p {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        max-width: 800px;
      }
      
      .slide ul {
        text-align: left;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .slide li {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
      }
      
      .slide a {
        color: #93c5fd;
      }
      
      @media (max-width: 768px) {
        .slide {
          padding: 1rem;
        }
        
        .slide h1 {
          font-size: 2rem;
        }
        
        .slide h2 {
          font-size: 1.8rem;
        }
        
        .slide p {
          font-size: 1rem;
        }
      }
    </style>
  `;
}