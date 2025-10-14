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

      // Extract slide images and text
      const slides = [];
      
      // First, try to find slide preview images in the PowerPoint file
      const slideImageFiles = Object.keys(zip.files)
        .filter(file => file.startsWith('ppt/media/') && (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')))
        .sort();
      
      console.log(`🖼️ Found ${slideImageFiles.length} media files in PowerPoint`);
      
      // Also look for slide preview images
      const slidePreviewFiles = Object.keys(zip.files)
        .filter(file => file.startsWith('docProps/thumbnail.') || file.includes('preview'))
        .sort();
        
      console.log(`🖼️ Found ${slidePreviewFiles.length} preview files in PowerPoint`);

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        console.log(`🔍 Processing ${slideFile}...`);

        try {
          // Get slide XML content
          const slideXml = await zip.files[slideFile].async('text');
          
          // Extract text using multiple methods
          const extractedText = extractAllText(slideXml);
          console.log(`📝 Slide ${i + 1} extracted text length:`, extractedText.length);

          // Try to find images referenced in this slide
          const slideImages = [];
          const imageRefs = slideXml.match(/r:embed="([^"]+)"/g);
          if (imageRefs) {
            console.log(`🖼️ Slide ${i + 1} has ${imageRefs.length} image references`);
          }

          slides.push({
            slideNumber: i + 1,
            text: extractedText,
            hasImages: slideXml.includes('<p:pic>') || slideXml.includes('<a:blip>'),
            hasText: !!extractedText,
            imageRefs: imageRefs || []
          });

          console.log(`✅ Slide ${i + 1} processed successfully`);

        } catch (slideError) {
          console.error(`❌ Error processing slide ${i + 1}:`, slideError);
          
          slides.push({
            slideNumber: i + 1,
            text: `Error processing slide: ${slideError.message}`,
            hasImages: false,
            hasText: false,
            error: true,
            imageRefs: []
          });
        }
      }

      // Use libreoffice-convert directly - it should preserve exact PowerPoint visuals
      console.log('🔄 Converting PowerPoint to PDF using libreoffice-convert...');
      
      try {
        const libreOfficeConvert = (await import('libreoffice-convert')).default;
        
        console.log('📄 Converting PowerPoint to PDF with exact visuals...');
        console.log('🔧 LibreOffice path: C:\\Program Files\\LibreOffice\\program\\soffice.exe');
        
        // Use the correct method - it's convert, not convertAsync
        const pdfBuffer = await new Promise((resolve, reject) => {
          libreOfficeConvert.convert(fileBuffer, '.pdf', undefined, (err, done) => {
            if (err) {
              console.error('❌ LibreOffice conversion error:', err);
              reject(err);
            } else {
              console.log('✅ LibreOffice conversion successful');
              resolve(done);
            }
          });
        });
        
        // Write PDF directly to temp file - this should contain the exact PowerPoint slides
        fs.writeFileSync(tempOutputFile, pdfBuffer);
        
        console.log('✅ PowerPoint converted to PDF successfully');
        console.log('📄 PDF file size:', pdfBuffer.length, 'bytes');
        
        // Validate the PDF
        try {
          const { PDFDocument } = await import('pdf-lib');
          const validationDoc = await PDFDocument.load(pdfBuffer);
          const pageCount = validationDoc.getPageCount();
          console.log('✅ PDF validation successful - pages:', pageCount);
          
          // Update slides count to match actual PDF pages
          slides.length = pageCount;
          
        } catch (validationError) {
          console.log('⚠️ PDF validation failed:', validationError.message);
          throw new Error('Generated PDF validation failed');
        }
        
        // Upload PDF to Backblaze
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
          method: 'libreoffice-convert',
          conversionMethod: 'LibreOffice (Real PowerPoint Conversion)'
        });
        
      } catch (libreOfficeError) {
        console.log('⚠️ libreoffice-convert failed, trying fallback method...');
        console.log('Error:', libreOfficeError.message);
        
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.create();

        // Try to extract and embed actual images from PowerPoint
        for (const slide of slides) {
          // Add a new page (landscape orientation)
          const page = pdfDoc.addPage([1024, 768]); // PowerPoint slide dimensions
          const { width, height } = page.getSize();

          // Embed font
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

          // Try to find and embed images for this slide
          let hasEmbeddedImage = false;
          
          // Look for slide-specific images in the media folder
          const slideMediaFiles = slideImageFiles.filter(mediaFile => {
            // Try to match images that might belong to this slide
            return mediaFile.includes(`image${slide.slideNumber}`) || 
                   mediaFile.includes(`slide${slide.slideNumber}`) ||
                   slideImageFiles.indexOf(mediaFile) === slide.slideNumber - 1;
          });

          if (slideMediaFiles.length > 0) {
            try {
              const imageFile = slideMediaFiles[0];
              console.log(`🖼️ Trying to embed image for slide ${slide.slideNumber}: ${imageFile}`);
              
              const imageBuffer = await zip.files[imageFile].async('uint8array');
              
              let embeddedImage;
              if (imageFile.toLowerCase().endsWith('.png')) {
                embeddedImage = await pdfDoc.embedPng(imageBuffer);
              } else if (imageFile.toLowerCase().endsWith('.jpg') || imageFile.toLowerCase().endsWith('.jpeg')) {
                embeddedImage = await pdfDoc.embedJpg(imageBuffer);
              }
              
              if (embeddedImage) {
                // Scale image to fit the page
                const imageAspectRatio = embeddedImage.width / embeddedImage.height;
                const pageAspectRatio = width / height;
                
                let imageWidth, imageHeight;
                if (imageAspectRatio > pageAspectRatio) {
                  // Image is wider, fit to width
                  imageWidth = width - 100; // Leave margins
                  imageHeight = imageWidth / imageAspectRatio;
                } else {
                  // Image is taller, fit to height
                  imageHeight = height - 100; // Leave margins
                  imageWidth = imageHeight * imageAspectRatio;
                }
                
                // Center the image
                const x = (width - imageWidth) / 2;
                const y = (height - imageHeight) / 2;
                
                page.drawImage(embeddedImage, {
                  x: x,
                  y: y,
                  width: imageWidth,
                  height: imageHeight,
                });
                
                hasEmbeddedImage = true;
                console.log(`✅ Embedded image for slide ${slide.slideNumber}`);
              }
            } catch (imageError) {
              console.log(`⚠️ Failed to embed image for slide ${slide.slideNumber}:`, imageError.message);
            }
          }

          // If no image was embedded, show text content
          if (!hasEmbeddedImage) {
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
              page.drawText('No content found in this slide', {
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
          }
        }

        // Serialize the PDF
        const pdfBytes = await pdfDoc.save();
        
        // Write PDF to temp file
        fs.writeFileSync(tempOutputFile, pdfBytes);
        
        console.log('📄 Fallback PDF created successfully using pdf-lib');
      }

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
        method: 'pdf-lib-fallback',
        conversionMethod: 'PDF-lib Fallback (Text Only - LibreOffice Failed)'
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