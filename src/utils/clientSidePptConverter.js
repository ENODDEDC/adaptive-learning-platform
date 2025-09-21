/**
 * Client-side PowerPoint converter
 * Extracts content directly in the browser without server dependencies
 */

/**
 * Extract PowerPoint content on the client side
 */
export async function extractPowerPointContent(fileUrl) {
  try {
    console.log('🚀 Starting client-side PowerPoint extraction...');
    console.log('📁 File URL:', fileUrl);

    // Fetch the PowerPoint file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PowerPoint file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('📦 File loaded, size:', arrayBuffer.byteLength, 'bytes');

    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    
    // Load the PPTX as a ZIP file
    const zip = await JSZip.loadAsync(arrayBuffer);
    console.log('📂 ZIP file loaded successfully');

    // Extract slides
    const slides = await extractSlidesFromZip(zip);
    console.log(`📄 Extracted ${slides.length} slides`);

    return {
      slides: slides,
      totalSlides: slides.length,
      method: 'client-side-extraction'
    };

  } catch (error) {
    console.error('❌ Client-side extraction failed:', error);
    throw error;
  }
}

/**
 * Extract slides from the ZIP structure
 */
async function extractSlidesFromZip(zip) {
  const slides = [];

  // Get slide files
  const slideFiles = Object.keys(zip.files)
    .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
    .sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return aNum - bNum;
    });

  console.log(`📄 Found ${slideFiles.length} slide files`);

  // Extract media files (images)
  const mediaFiles = {};
  const mediaEntries = Object.keys(zip.files).filter(file => 
    file.startsWith('ppt/media/') && 
    (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif'))
  );

  console.log(`🖼️ Found ${mediaEntries.length} media files`);

  // Convert media files to data URLs
  for (const mediaFile of mediaEntries) {
    try {
      const mediaData = await zip.files[mediaFile].async('base64');
      const extension = mediaFile.split('.').pop().toLowerCase();
      const mimeType = getMimeType(extension);
      mediaFiles[mediaFile] = `data:${mimeType};base64,${mediaData}`;
      console.log(`   📸 Processed: ${mediaFile}`);
    } catch (error) {
      console.warn(`⚠️ Failed to process media file ${mediaFile}:`, error);
    }
  }

  // Process each slide
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    console.log(`\n🔍 Processing slide ${i + 1}: ${slideFile}`);

    try {
      const slideXml = await zip.files[slideFile].async('text');
      
      // Extract text content
      const slideText = extractTextFromSlideXml(slideXml);
      console.log(`   📝 Text extracted: "${slideText.substring(0, 50)}${slideText.length > 50 ? '...' : ''}"`);

      // Extract image references
      const imageRefs = extractImageReferences(slideXml);
      console.log(`   🖼️ Image references found: ${imageRefs.length}`);

      // Create slide representation
      const slideData = await createSlideRepresentation(
        i + 1, 
        slideText, 
        imageRefs, 
        mediaFiles, 
        slideXml
      );

      slides.push(slideData);
      console.log(`   ✅ Slide ${i + 1} processed successfully`);

    } catch (error) {
      console.error(`❌ Failed to process slide ${i + 1}:`, error);
      
      // Create fallback slide
      slides.push({
        slideNumber: i + 1,
        text: '',
        notes: '',
        imageUrl: createFallbackSlide(i + 1, 'Failed to process slide'),
        hasImages: false,
        hasText: false
      });
    }
  }

  return slides;
}

/**
 * Extract text content from slide XML
 */
function extractTextFromSlideXml(slideXml) {
  const textElements = [];
  
  // Method 1: Extract from <a:t> tags
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

  // Method 2: Extract from text body elements
  const txBodyMatches = slideXml.match(/<p:txBody[^>]*>(.*?)<\/p:txBody>/gs);
  if (txBodyMatches) {
    txBodyMatches.forEach(txBody => {
      const innerTexts = txBody.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
      if (innerTexts) {
        innerTexts.forEach(innerText => {
          const text = innerText
            .replace(/<a:t[^>]*>/, '')
            .replace(/<\/a:t>/, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
          if (text && text.length > 0 && !textElements.includes(text)) {
            textElements.push(text);
          }
        });
      }
    });
  }

  return textElements.join(' ').trim();
}

/**
 * Extract image references from slide XML
 */
function extractImageReferences(slideXml) {
  const imageRefs = [];
  
  // Look for image references in the XML
  const imageMatches = slideXml.match(/r:embed="([^"]+)"/g);
  if (imageMatches) {
    imageMatches.forEach(match => {
      const refId = match.match(/r:embed="([^"]+)"/)?.[1];
      if (refId) {
        imageRefs.push(refId);
      }
    });
  }

  return imageRefs;
}

/**
 * Create slide representation with text and images
 */
async function createSlideRepresentation(slideNumber, text, imageRefs, mediaFiles, slideXml) {
  // Create canvas for slide
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size (standard PowerPoint slide dimensions)
  canvas.width = 1920;
  canvas.height = 1080;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add slide number
  ctx.fillStyle = '#666666';
  ctx.font = '24px Arial';
  ctx.fillText(`Slide ${slideNumber}`, 50, 50);

  // Add text content
  if (text) {
    await renderTextOnCanvas(ctx, text, canvas.width, canvas.height);
  }

  // Add images if available
  if (imageRefs.length > 0 && Object.keys(mediaFiles).length > 0) {
    await renderImagesOnCanvas(ctx, imageRefs, mediaFiles, canvas.width, canvas.height);
  }

  // Convert canvas to data URL
  const imageUrl = canvas.toDataURL('image/png');

  return {
    slideNumber: slideNumber,
    text: text,
    notes: '', // Could extract notes if needed
    imageUrl: imageUrl,
    hasImages: imageRefs.length > 0,
    hasText: !!text
  };
}

/**
 * Render text content on canvas
 */
async function renderTextOnCanvas(ctx, text, canvasWidth, canvasHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  const maxWidth = canvasWidth - 200; // Leave margins
  
  // Set text style
  ctx.font = '48px Arial';
  ctx.fillStyle = '#333333';
  
  // Break text into lines
  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
    
    if (lines.length >= 15) break; // Limit lines
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  // Render lines
  const lineHeight = 60;
  const startY = 200;
  
  lines.forEach((line, index) => {
    const y = startY + (index * lineHeight);
    if (index === 0) {
      // First line as title
      ctx.font = 'bold 64px Arial';
      ctx.fillStyle = '#1f2937';
    } else {
      // Other lines as content
      ctx.font = '48px Arial';
      ctx.fillStyle = '#374151';
    }
    
    ctx.fillText(line, 100, y);
  });
}

/**
 * Render images on canvas (simplified)
 */
async function renderImagesOnCanvas(ctx, imageRefs, mediaFiles, canvasWidth, canvasHeight) {
  // For now, just indicate that images are present
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(canvasWidth - 300, 100, 200, 150);
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px Arial';
  ctx.fillText('📷 Images', canvasWidth - 250, 180);
  ctx.fillText(`${imageRefs.length} found`, canvasWidth - 250, 200);
}

/**
 * Create fallback slide for errors
 */
function createFallbackSlide(slideNumber, message) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1920;
  canvas.height = 1080;

  // Background
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Error message
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Slide ${slideNumber}`, canvas.width / 2, canvas.height / 2 - 50);
  
  ctx.fillStyle = '#6b7280';
  ctx.font = '32px Arial';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 20);

  return canvas.toDataURL('image/png');
}

/**
 * Get MIME type for file extension
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