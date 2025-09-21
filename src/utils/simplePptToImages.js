/**
 * Simple PowerPoint to Images Converter
 * Converts each slide to an image for direct display
 */

/**
 * Convert PowerPoint slides to images - Direct extraction method
 */
export async function convertPPTSlidesToImages(fileUrl) {
  try {
    console.log('🖼️ Converting PowerPoint slides to images...');
    console.log('📁 File URL:', fileUrl);

    // Use direct extraction method (skip viewer methods that don't work)
    console.log('🔧 Using direct PowerPoint extraction...');
    const result = await extractAndRenderSlides(fileUrl);
    console.log('✅ Direct extraction successful');
    return result;

  } catch (error) {
    console.error('❌ PowerPoint extraction failed:', error);
    throw error;
  }
}

/**
 * Method 1: Use Google Docs Viewer (iframe capture)
 */
async function convertUsingGoogleViewer(fileUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Create hidden iframe with Google Docs Viewer
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1920px';
      iframe.style.height = '1080px';
      iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      
      document.body.appendChild(iframe);

      iframe.onload = async () => {
        try {
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try to capture slides (this is limited due to CORS)
          // For now, create placeholder slides
          const slides = await createPlaceholderSlides(10, 'Google Viewer');
          
          document.body.removeChild(iframe);
          resolve({
            slides: slides,
            method: 'google-viewer',
            totalSlides: slides.length
          });
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Google Viewer failed to load'));
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          reject(new Error('Google Viewer timeout'));
        }
      }, 10000);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Method 2: Use Office Online Viewer
 */
async function convertUsingOfficeViewer(fileUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Create hidden iframe with Office Online Viewer
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1920px';
      iframe.style.height = '1080px';
      iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
      
      document.body.appendChild(iframe);

      iframe.onload = async () => {
        try {
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Create placeholder slides (Office viewer has CORS restrictions)
          const slides = await createPlaceholderSlides(10, 'Office Viewer');
          
          document.body.removeChild(iframe);
          resolve({
            slides: slides,
            method: 'office-viewer',
            totalSlides: slides.length
          });
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Office Viewer failed to load'));
      };

      // Timeout after 15 seconds
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
          reject(new Error('Office Viewer timeout'));
        }
      }, 15000);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Method 3: Extract slides manually and render as images
 */
async function extractAndRenderSlides(fileUrl) {
  try {
    console.log('🔧 Starting manual slide extraction...');

    // Fetch the PowerPoint file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('📦 File loaded, size:', arrayBuffer.byteLength, 'bytes');

    // Import JSZip
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    console.log('📂 ZIP file loaded');

    // Get slide files
    const slideFiles = Object.keys(zip.files)
      .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return aNum - bNum;
      });

    console.log(`📄 Found ${slideFiles.length} slides`);

    // Extract media files
    const mediaFiles = {};
    const mediaEntries = Object.keys(zip.files).filter(file => 
      file.startsWith('ppt/media/') && 
      /\.(png|jpg|jpeg|gif)$/i.test(file)
    );

    console.log(`🖼️ Found ${mediaEntries.length} media files`);

    // Convert media to data URLs
    for (const mediaFile of mediaEntries) {
      try {
        const mediaData = await zip.files[mediaFile].async('base64');
        const extension = mediaFile.split('.').pop().toLowerCase();
        const mimeType = getMimeType(extension);
        mediaFiles[mediaFile] = `data:${mimeType};base64,${mediaData}`;
      } catch (error) {
        console.warn(`Failed to process ${mediaFile}:`, error);
      }
    }

    // Process each slide
    const slides = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      console.log(`🔍 Processing slide ${i + 1}...`);

      try {
        const slideXml = await zip.files[slideFile].async('text');
        
        // Extract text for search
        const slideText = extractTextFromXml(slideXml);
        
        // Create slide image
        const slideImage = await createSlideImage(
          i + 1, 
          slideText, 
          slideXml, 
          mediaFiles
        );

        slides.push({
          slideNumber: i + 1,
          imageUrl: slideImage,
          text: slideText,
          notes: '',
          hasImages: Object.keys(mediaFiles).length > 0,
          hasText: !!slideText
        });

        console.log(`✅ Slide ${i + 1} converted to image`);

      } catch (error) {
        console.error(`❌ Failed to process slide ${i + 1}:`, error);
        
        // Create error slide
        slides.push({
          slideNumber: i + 1,
          imageUrl: createErrorSlide(i + 1),
          text: '',
          notes: '',
          hasImages: false,
          hasText: false
        });
      }
    }

    return {
      slides: slides,
      method: 'manual-extraction',
      totalSlides: slides.length
    };

  } catch (error) {
    console.error('❌ Manual extraction failed:', error);
    throw error;
  }
}

/**
 * Create slide image using canvas with enhanced PowerPoint-like styling
 */
async function createSlideImage(slideNumber, text, slideXml, mediaFiles) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Standard PowerPoint slide dimensions (16:9)
  canvas.width = 1920;
  canvas.height = 1080;

  // Create PowerPoint-like background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#f8fafc');
  gradient.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add PowerPoint-style header bar
  const headerGradient = ctx.createLinearGradient(0, 0, 0, 80);
  headerGradient.addColorStop(0, '#1e40af');
  headerGradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, canvas.width, 80);

  // Slide number in header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`Slide ${slideNumber}`, 40, 50);

  // Add PowerPoint logo/icon
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px Arial';
  ctx.fillText('📊', canvas.width - 80, 50);

  // Main content area with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(60, 120, canvas.width - 120, canvas.height - 200);
  ctx.shadowColor = 'transparent';

  // Add text content if available
  if (text) {
    await renderEnhancedTextContent(ctx, text, canvas.width, canvas.height);
  } else {
    // Enhanced no text placeholder
    ctx.fillStyle = '#64748b';
    ctx.font = '48px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PowerPoint Slide Content', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Text extraction in progress...', canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = 'left';
  }

  // Add embedded images if available
  if (Object.keys(mediaFiles).length > 0) {
    await renderEmbeddedImages(ctx, mediaFiles, canvas.width, canvas.height);
  }

  // Add PowerPoint-style footer
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`PowerPoint Slide ${slideNumber}`, 40, canvas.height - 15);
  
  // Add timestamp
  const now = new Date();
  ctx.fillText(now.toLocaleDateString(), canvas.width - 150, canvas.height - 15);

  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Render enhanced text content on canvas (PowerPoint-style)
 */
async function renderEnhancedTextContent(ctx, text, canvasWidth, canvasHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  const maxWidth = canvasWidth - 200; // Content area margins
  
  // Break text into lines
  ctx.font = '48px "Segoe UI", Arial, sans-serif';
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
    
    if (lines.length >= 10) break; // Limit lines to fit in content area
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  // Render lines with PowerPoint-style formatting
  const lineHeight = 80;
  const startY = 220; // Start below header and content area
  
  lines.forEach((line, index) => {
    const y = startY + (index * lineHeight);
    
    if (index === 0) {
      // Title style
      ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#1e40af';
      ctx.textAlign = 'center';
      ctx.fillText(line, canvasWidth / 2, y);
      ctx.textAlign = 'left';
    } else {
      // Content style
      ctx.font = '48px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#1f2937';
      ctx.fillText(line, 120, y);
    }
  });

  // Add bullet points for content lines
  ctx.fillStyle = '#3b82f6';
  for (let i = 1; i < lines.length; i++) {
    const y = startY + (i * lineHeight);
    ctx.beginPath();
    ctx.arc(100, y - 15, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Render embedded images on canvas
 */
async function renderEmbeddedImages(ctx, mediaFiles, canvasWidth, canvasHeight) {
  const imageKeys = Object.keys(mediaFiles);
  if (imageKeys.length === 0) return;

  // Create image preview area
  const previewX = canvasWidth - 300;
  const previewY = 150;
  const previewWidth = 200;
  const previewHeight = 150;

  // Background for image preview
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(previewX, previewY, previewWidth, previewHeight);
  
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(previewX, previewY, previewWidth, previewHeight);

  // Try to load and display the first image
  try {
    const firstImageData = mediaFiles[imageKeys[0]];
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate scaling to fit preview area
        const scale = Math.min(
          previewWidth / img.width,
          previewHeight / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        const x = previewX + (previewWidth - scaledWidth) / 2;
        const y = previewY + (previewHeight - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        resolve();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = firstImageData;
      
      // Timeout after 2 seconds
      setTimeout(() => reject(new Error('Image load timeout')), 2000);
    });

  } catch (error) {
    // Fallback: show image placeholder
    ctx.fillStyle = '#64748b';
    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📷', previewX + previewWidth / 2, previewY + previewHeight / 2 - 10);
    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${imageKeys.length} image(s)`, previewX + previewWidth / 2, previewY + previewHeight / 2 + 20);
    ctx.textAlign = 'left';
  }
}

/**
 * Render text content on canvas (legacy function)
 */
async function renderTextContent(ctx, text, canvasWidth, canvasHeight) {
  // Use the enhanced version
  await renderEnhancedTextContent(ctx, text, canvasWidth, canvasHeight);
}

/**
 * Extract text from slide XML
 */
function extractTextFromXml(slideXml) {
  const textElements = [];
  
  // Extract from <a:t> tags
  const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
  if (textMatches) {
    textMatches.forEach(match => {
      const text = match
        .replace(/<a:t[^>]*>/, '')
        .replace(/<\/a:t>/, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
      if (text && text.length > 0) {
        textElements.push(text);
      }
    });
  }

  return textElements.join(' ').trim();
}

/**
 * Create placeholder slides
 */
async function createPlaceholderSlides(count, method) {
  const slides = [];
  
  for (let i = 1; i <= count; i++) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1920;
    canvas.height = 1080;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Content
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Slide ${i}`, canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '36px Arial';
    ctx.fillText(`Converted using ${method}`, canvas.width / 2, canvas.height / 2 + 50);

    slides.push({
      slideNumber: i,
      imageUrl: canvas.toDataURL('image/png'),
      text: `Slide ${i}`,
      notes: '',
      hasImages: false,
      hasText: true
    });
  }
  
  return slides;
}

/**
 * Create error slide
 */
function createErrorSlide(slideNumber) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1920;
  canvas.height = 1080;

  // Background
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Error content
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 64px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Slide ${slideNumber}`, canvas.width / 2, canvas.height / 2 - 50);
  
  ctx.fillStyle = '#7f1d1d';
  ctx.font = '32px Arial';
  ctx.fillText('Failed to process', canvas.width / 2, canvas.height / 2 + 50);

  return canvas.toDataURL('image/png');
}

/**
 * Get MIME type for extension
 */
function getMimeType(extension) {
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  };
  return mimeTypes[extension] || 'image/png';
}