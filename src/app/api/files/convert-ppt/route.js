import { NextResponse } from 'next/server';
import backblazeService from '../../../../services/backblazeService';

export async function POST(request) {
  try {
    const { filePath, fileName } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Converting PowerPoint file:', fileName);
    console.log('🎯 Original filePath:', filePath);

    // Extract file key from URL if it's a full URL
    let fileKey = filePath;
    if (filePath.includes('/api/files/')) {
      const urlParts = filePath.split('/api/files/');
      fileKey = urlParts[1] ? decodeURIComponent(urlParts[1]) : filePath;
      console.log('🎯 Extracted file key:', fileKey);
    }

    // Get file from Backblaze
    const fileBuffer = await backblazeService.getFileBuffer(fileKey);
    
    if (!fileBuffer) {
      throw new Error('Failed to fetch file from storage');
    }

    console.log('📦 PowerPoint file loaded, size:', fileBuffer.length, 'bytes');

    // Load JSZip for PPTX extraction
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(fileBuffer);
    console.log('📂 PPTX ZIP structure loaded successfully');

    // Find slide files
    const slideFiles = Object.keys(zip.files)
      .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return aNum - bNum;
      });

    console.log(`📄 Found ${slideFiles.length} slide files`);

    if (slideFiles.length === 0) {
      throw new Error('No slide files found in PowerPoint');
    }

    // Process each slide
    const slides = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      console.log(`🔍 Processing ${slideFile}...`);

      try {
        // Get slide XML content
        const slideXml = await zip.files[slideFile].async('text');
        
        // Extract text using multiple methods
        const extractedText = extractAllText(slideXml);
        console.log(`📝 Slide ${i + 1} extracted text length:`, extractedText.length);

        // Create slide data (without canvas - we'll generate images differently)
        slides.push({
          slideNumber: i + 1,
          text: extractedText,
          notes: '', // Could extract speaker notes if needed
          hasImages: slideXml.includes('<p:pic>') || slideXml.includes('<a:blip>'),
          hasText: !!extractedText,
          rawXml: slideXml // Include raw XML for advanced processing if needed
        });

        console.log(`✅ Slide ${i + 1} processed successfully`);

      } catch (slideError) {
        console.error(`❌ Error processing slide ${i + 1}:`, slideError);
        
        // Create error slide
        slides.push({
          slideNumber: i + 1,
          text: `Error processing slide: ${slideError.message}`,
          notes: '',
          hasImages: false,
          hasText: false,
          error: true
        });
      }
    }

    console.log(`✅ PowerPoint conversion completed: ${slides.length} slides processed`);
    
    return NextResponse.json({
      success: true,
      slides: slides,
      method: 'server-side-extraction',
      totalSlides: slides.length,
      fileName: fileName
    });

  } catch (error) {
    console.error('❌ PowerPoint conversion failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert PowerPoint file',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Extract all text from slide XML using multiple methods
 */
function extractAllText(slideXml) {
  const textElements = [];

  // Method 1: Extract from <a:t> tags (most common)
  const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
  if (textMatches) {
    textMatches.forEach(match => {
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
        textElements.push(text);
      }
    });
  }

  // Method 2: Extract from paragraph elements
  const paragraphMatches = slideXml.match(/<a:p[^>]*>(.*?)<\/a:p>/gs);
  if (paragraphMatches) {
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

  // Method 4: Fallback - extract any readable text
  if (textElements.length === 0) {
    const cleanText = slideXml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const words = cleanText.split(' ')
      .filter(word => word.length > 2 && /[a-zA-Z]/.test(word))
      .slice(0, 50);
    
    if (words.length > 0) {
      textElements.push(words.join(' '));
    }
  }

  return textElements.join(' ').trim();
}