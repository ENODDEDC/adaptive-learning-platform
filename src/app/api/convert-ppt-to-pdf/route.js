import { NextResponse } from 'next/server';
import backblazeService from '../../../services/backblazeService';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  let tempInputFile = null;
  let tempOutputFile = null;

  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('filePath');
    const contentId = searchParams.get('contentId');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Converting PowerPoint to PDF:', filePath);

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

    // Create temporary files
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const uniqueId = uuidv4();
    tempInputFile = path.join(tempDir, `pptx_${uniqueId}.pptx`);
    tempOutputFile = path.join(tempDir, `pdf_${uniqueId}.pdf`);

    // Write PowerPoint file to temp location
    fs.writeFileSync(tempInputFile, fileBuffer);
    console.log('📁 Temporary PowerPoint file created:', tempInputFile);

    // Use pdf-poppler to convert PowerPoint to PDF (simpler approach)
    console.log('🔄 Converting PowerPoint to PDF using pdf-poppler...');
    
    try {
      // Import pdf-poppler
      const pdfPoppler = (await import('pdf-poppler')).default;
      
      // First, we need to extract slides and create a simple PDF
      // Since pdf-poppler is for PDF to images, let's create a basic PDF first
      
      // Extract PowerPoint content using JSZip
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

      // Process each slide to extract text
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

          slides.push({
            slideNumber: i + 1,
            text: extractedText,
            hasImages: slideXml.includes('<p:pic>') || slideXml.includes('<a:blip>'),
            hasText: !!extractedText
          });

          console.log(`✅ Slide ${i + 1} processed successfully`);

        } catch (slideError) {
          console.error(`❌ Error processing slide ${i + 1}:`, slideError);
          
          slides.push({
            slideNumber: i + 1,
            text: `Error processing slide: ${slideError.message}`,
            hasImages: false,
            hasText: false,
            error: true
          });
        }
      }

      // Create a simple PDF using pdf-lib (server-side compatible)
      console.log('🔄 Creating PDF using pdf-lib...');
      
      const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      // Add slides to PDF
      for (const slide of slides) {
        // Add a new page (landscape orientation)
        const page = pdfDoc.addPage([1024, 768]); // PowerPoint slide dimensions
        const { width, height } = page.getSize();

        // Embed font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Header
        page.drawText(`Slide ${slide.slideNumber}`, {
          x: 50,
          y: height - 80,
          size: 24,
          font: boldFont,
          color: rgb(0.12, 0.16, 0.23), // #1e293b
        });

        // Content
        if (slide.text && slide.text.length > 0) {
          // Split text into lines that fit the page
          const maxWidth = width - 100; // Margins
          const fontSize = 16;
          const lineHeight = 20;
          const maxLines = Math.floor((height - 200) / lineHeight); // Leave space for header and footer
          
          const words = slide.text.split(' ');
          const lines = [];
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (textWidth > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
              
              if (lines.length >= maxLines) break;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine && lines.length < maxLines) {
            lines.push(currentLine);
          }
          
          // Add "..." if text was truncated
          if (words.length > lines.join(' ').split(' ').length) {
            if (lines.length === maxLines) {
              lines[lines.length - 1] += '...';
            } else {
              lines.push('...');
            }
          }

          // Draw text lines
          lines.forEach((line, index) => {
            page.drawText(line, {
              x: 50,
              y: height - 140 - (index * lineHeight),
              size: fontSize,
              font: font,
              color: rgb(0.22, 0.25, 0.32), // #374151
            });
          });
        } else {
          page.drawText('No text content found in this slide', {
            x: 50,
            y: height - 140,
            size: 14,
            font: font,
            color: rgb(0.61, 0.64, 0.69), // #9ca3af
          });
        }

        // Footer
        page.drawText(`PowerPoint Slide ${slide.slideNumber} - Converted to PDF`, {
          x: 50,
          y: 50,
          size: 10,
          font: font,
          color: rgb(0.42, 0.45, 0.50), // #6b7280
        });
        
        if (slide.hasImages) {
          page.drawText('Contains Images', {
            x: width - 150,
            y: 50,
            size: 10,
            font: font,
            color: rgb(0.42, 0.45, 0.50), // #6b7280
          });
        }
      }

      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Write PDF to temp file
      fs.writeFileSync(tempOutputFile, pdfBytes);
      
      console.log('📄 PDF created successfully using pdf-lib');

      // Verify PDF was created
      if (!fs.existsSync(tempOutputFile)) {
        throw new Error('PDF creation failed - output file not created');
      }

      const pdfStats = fs.statSync(tempOutputFile);
      console.log('📄 PDF file size:', pdfStats.size, 'bytes');

      // Upload PDF to Backblaze
      const pdfBuffer = fs.readFileSync(tempOutputFile);
      const pdfFileName = `converted_${uniqueId}.pdf`;
      
      const uploadResult = await backblazeService.uploadFile(
        pdfBuffer,
        pdfFileName,
        'application/pdf',
        'temp/ppt-conversions'
      );

      console.log('✅ PDF uploaded to Backblaze:', uploadResult.url);
      console.log('📊 Page count:', slides.length);

      // Return a URL to our own API endpoint instead of direct Backblaze URL
      const apiPdfUrl = `/api/files/${encodeURIComponent(uploadResult.key)}`;
      
      return NextResponse.json({
        success: true,
        pdfUrl: apiPdfUrl,
        pageCount: slides.length,
        originalFile: filePath,
        convertedFile: uploadResult.key,
        method: 'pdfkit-generation'
      });

    } catch (conversionError) {
      console.error('❌ PDF conversion failed:', conversionError);
      throw new Error(`PDF conversion failed: ${conversionError.message}`);
    }

  } catch (error) {
    console.error('❌ PowerPoint to PDF conversion failed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert PowerPoint to PDF',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    // Clean up temporary files
    try {
      if (tempInputFile && fs.existsSync(tempInputFile)) {
        fs.unlinkSync(tempInputFile);
        console.log('🧹 Cleaned up temp input file');
      }
      if (tempOutputFile && fs.existsSync(tempOutputFile)) {
        fs.unlinkSync(tempOutputFile);
        console.log('🧹 Cleaned up temp output file');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temp files:', cleanupError.message);
    }
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