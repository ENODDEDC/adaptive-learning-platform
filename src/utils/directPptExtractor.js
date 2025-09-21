/**
 * Direct PowerPoint Extractor - Simple and Reliable
 * Extracts content directly from PPTX files without complex processing
 */

export async function extractPowerPointSlides(fileUrl) {
  try {
    console.log('🚀 Starting direct PowerPoint extraction...');
    console.log('📁 File URL:', fileUrl);

    // Fetch the PowerPoint file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PowerPoint file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log('📦 PowerPoint file loaded, size:', arrayBuffer.byteLength, 'bytes');

    // Load JSZip
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    console.log('📂 PPTX ZIP structure loaded successfully');

    // Debug: List all files in the ZIP
    console.log('📋 Files in PPTX:', Object.keys(zip.files).slice(0, 20));

    // Find slide files
    const slideFiles = Object.keys(zip.files)
      .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return aNum - bNum;
      });

    console.log(`📄 Found ${slideFiles.length} slide files:`, slideFiles);

    if (slideFiles.length === 0) {
      throw new Error('No slide files found in PowerPoint');
    }

    // Process each slide
    const slides = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      console.log(`\n🔍 Processing ${slideFile}...`);

      try {
        // Get slide XML content
        const slideXml = await zip.files[slideFile].async('text');
        console.log(`📄 Slide ${i + 1} XML length:`, slideXml.length, 'characters');
        
        // Log first 500 characters of XML for debugging
        console.log(`📄 Slide ${i + 1} XML preview:`, slideXml.substring(0, 500));

        // Extract text using multiple methods
        const extractedText = extractAllText(slideXml);
        console.log(`📝 Slide ${i + 1} extracted text:`, extractedText);

        // Create slide image
        const slideImage = createSimpleSlideImage(i + 1, extractedText);

        slides.push({
          slideNumber: i + 1,
          imageUrl: slideImage,
          text: extractedText,
          notes: '',
          hasImages: false,
          hasText: !!extractedText
        });

        console.log(`✅ Slide ${i + 1} processed successfully`);

      } catch (slideError) {
        console.error(`❌ Error processing slide ${i + 1}:`, slideError);
        
        // Create error slide
        slides.push({
          slideNumber: i + 1,
          imageUrl: createErrorSlideImage(i + 1, slideError.message),
          text: '',
          notes: '',
          hasImages: false,
          hasText: false
        });
      }
    }

    console.log(`✅ PowerPoint extraction completed: ${slides.length} slides processed`);
    
    return {
      slides: slides,
      method: 'direct-extraction',
      totalSlides: slides.length
    };

  } catch (error) {
    console.error('❌ PowerPoint extraction failed:', error);
    throw error;
  }
}

/**
 * Extract all text from slide XML using multiple methods
 */
function extractAllText(slideXml) {
  console.log('🔍 Starting text extraction...');
  const textElements = [];

  // Method 1: Extract from <a:t> tags
  console.log('📝 Method 1: Extracting from <a:t> tags...');
  const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
  if (textMatches) {
    console.log(`   Found ${textMatches.length} <a:t> matches`);
    textMatches.forEach((match, index) => {
      const text = match
        .replace(/<a:t[^>]*>/, '')
        .replace(/<\/a:t>/, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      
      if (text && text.length > 0) {
        console.log(`   Text ${index + 1}: "${text}"`);
        textElements.push(text);
      }
    });
  } else {
    console.log('   No <a:t> tags found');
  }

  // Method 2: Extract from paragraph elements
  console.log('📝 Method 2: Extracting from <a:p> paragraphs...');
  const paragraphMatches = slideXml.match(/<a:p[^>]*>(.*?)<\/a:p>/gs);
  if (paragraphMatches) {
    console.log(`   Found ${paragraphMatches.length} paragraph matches`);
    paragraphMatches.forEach(paragraph => {
      const innerTexts = paragraph.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
      if (innerTexts) {
        innerTexts.forEach(innerText => {
          const text = innerText
            .replace(/<a:t[^>]*>/, '')
            .replace(/<\/a:t>/, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          
          if (text && text.length > 0 && !textElements.includes(text)) {
            textElements.push(text);
          }
        });
      }
    });
  }

  // Method 3: Extract from text body elements
  console.log('📝 Method 3: Extracting from <p:txBody> elements...');
  const txBodyMatches = slideXml.match(/<p:txBody[^>]*>(.*?)<\/p:txBody>/gs);
  if (txBodyMatches) {
    console.log(`   Found ${txBodyMatches.length} txBody matches`);
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
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          
          if (text && text.length > 0 && !textElements.includes(text)) {
            textElements.push(text);
          }
        });
      }
    });
  }

  // Method 4: Fallback - extract any text content
  if (textElements.length === 0) {
    console.log('📝 Method 4: Fallback text extraction...');
    const cleanText = slideXml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ')
      .filter(word => word.length > 2 && /[a-zA-Z]/.test(word))
      .slice(0, 50);
    
    if (words.length > 0) {
      const fallbackText = words.join(' ');
      console.log(`   Fallback text: "${fallbackText.substring(0, 100)}..."`);
      textElements.push(fallbackText);
    }
  }

  const finalText = textElements.join(' ').trim();
  console.log(`✅ Final extracted text (${finalText.length} chars): "${finalText.substring(0, 200)}${finalText.length > 200 ? '...' : ''}"`);
  
  return finalText;
}

/**
 * Create simple slide image with extracted text
 */
function createSimpleSlideImage(slideNumber, text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Standard slide dimensions
  canvas.width = 1920;
  canvas.height = 1080;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Header
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 48px Arial';
  ctx.fillText(`Slide ${slideNumber}`, 60, 80);

  // Content
  if (text && text.length > 0) {
    // Split text into words and create lines
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    const maxWidth = canvas.width - 120;
    
    ctx.font = '36px Arial';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
      
      if (lines.length >= 20) break; // Limit lines
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    // Render text lines
    ctx.fillStyle = '#374151';
    const lineHeight = 50;
    const startY = 180;
    
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);
      if (index === 0 && lines.length > 1) {
        // First line as title
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#1f2937';
      } else {
        // Regular content
        ctx.font = '36px Arial';
        ctx.fillStyle = '#374151';
      }
      
      ctx.fillText(line, 60, y);
    });
    
  } else {
    // No text found
    ctx.fillStyle = '#9ca3af';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No text content found in this slide', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }

  // Footer
  ctx.fillStyle = '#6b7280';
  ctx.font = '24px Arial';
  ctx.fillText(`PowerPoint Slide ${slideNumber} - Extracted Content`, 60, canvas.height - 40);

  return canvas.toDataURL('image/png', 0.9);
}

/**
 * Create error slide image
 */
function createErrorSlideImage(slideNumber, errorMessage) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1920;
  canvas.height = 1080;

  // Red background
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Error content
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Slide ${slideNumber} - Error`, canvas.width / 2, canvas.height / 2 - 50);
  
  ctx.fillStyle = '#7f1d1d';
  ctx.font = '24px Arial';
  ctx.fillText(errorMessage, canvas.width / 2, canvas.height / 2 + 20);

  return canvas.toDataURL('image/png');
}