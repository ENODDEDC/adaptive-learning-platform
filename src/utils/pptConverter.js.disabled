/**
 * PowerPoint Conversion Utilities
 * Multiple conversion methods with fallbacks
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { uploadToS3, generateS3Key } from './s3Utils.js';

const execFileAsync = promisify(execFile);

/**
 * Primary conversion method using LibreOffice to render slides as PNG
 */
export async function convertWithLibreOffice(pptBuffer, outputDir) {
  const tempPptPath = path.join(outputDir, `temp_${Date.now()}.pptx`);

  try {
    // Write PPT buffer to temp file
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(tempPptPath, pptBuffer);

    // Try using direct soffice command with full path
    try {
      const sofficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

      await execFileAsync(sofficePath, [
        '--headless',
        '--convert-to',
        'png',
        '--outdir',
        outputDir,
        tempPptPath
      ]);

      // Collect PNG files (LibreOffice creates slide1.png, slide2.png, etc.)
      const files = await fs.readdir(outputDir);
      const pngFiles = files
        .filter(file => file.endsWith('.png') && file.startsWith('slide'))
        .sort()
        .map(file => path.join(outputDir, file));

      if (pngFiles.length === 0) {
        throw new Error('No PNG files were generated from the PPTX');
      }

      return pngFiles;

    } catch (sofficeError) {
      console.warn('Direct soffice command failed, trying libreoffice-convert package:', sofficeError.message);

      // Fallback to libreoffice-convert package
      try {
        const libreOfficeConvert = (await import('libreoffice-convert')).default;
        const ext = '.png';

        const result = await libreOfficeConvert.convertAsync(pptBuffer, ext, undefined, {
          tmpOptions: { tempDir: outputDir }
        });

        // Write the result to files
        const baseName = path.basename(tempPptPath, path.extname(tempPptPath));
        const outputPath = path.join(outputDir, `${baseName}.png`);
        await fs.writeFile(outputPath, result);

        // If successful, return the single file (for single slide or merged)
        return [outputPath];

      } catch (libreConvertError) {
        console.warn('libreoffice-convert also failed:', libreConvertError.message);
        throw new Error(`Both LibreOffice methods failed. soffice: ${sofficeError.message}, convert: ${libreConvertError.message}`);
      }
    }

  } catch (error) {
    throw new Error(`LibreOffice conversion failed: ${error.message}`);
  } finally {
    // Cleanup temp PPTX
    try {
      await fs.unlink(tempPptPath);
    } catch (error) {
      console.warn('Failed to cleanup temp PPTX:', error.message);
    }
  }
}

/**
 * Fallback: Use Python-based conversion (requires python-pptx)
 */
export async function convertWithPython(pptBuffer, outputPath) {
  // This would require a Python script that uses python-pptx
  // For now, return a placeholder
  throw new Error('Python conversion not implemented yet');
}

/**
 * Fallback: Use online conversion service
 */
export async function convertWithOnlineService(pptBuffer, outputPath) {
  // This would use services like CloudConvert, Zamzar, etc.
  // For now, return a placeholder
  throw new Error('Online conversion service not implemented yet');
}

/**
 * Extract text content from slide XML
 */
function extractTextFromSlideXml(slideXml) {
  console.log('🔍 Extracting text from slide XML...');
  const textElements = [];
  
  // Debug: Log a sample of the XML to see its structure
  console.log('📄 XML sample (first 500 chars):', slideXml.substring(0, 500));
  
  // Method 1: Extract text from <a:t> tags (text runs) - most common
  const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
  if (textMatches) {
    console.log(`📝 Found ${textMatches.length} <a:t> text matches`);
    textMatches.forEach((match, index) => {
      const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '').trim();
      if (text && text.length > 0) {
        console.log(`   Text ${index + 1}: "${text}"`);
        textElements.push(text);
      }
    });
  } else {
    console.log('❌ No <a:t> tags found');
  }

  // Method 2: Extract from <p:txBody> (text body elements)
  const txBodyMatches = slideXml.match(/<p:txBody[^>]*>(.*?)<\/p:txBody>/gs);
  if (txBodyMatches) {
    console.log(`📝 Found ${txBodyMatches.length} <p:txBody> elements`);
    txBodyMatches.forEach(txBody => {
      const innerTextMatches = txBody.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
      if (innerTextMatches) {
        innerTextMatches.forEach(innerMatch => {
          const text = innerMatch.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '').trim();
          if (text && text.length > 0 && !textElements.includes(text)) {
            textElements.push(text);
          }
        });
      }
    });
  }

  // Method 3: Extract from <a:p> paragraphs with more flexible matching
  const paragraphMatches = slideXml.match(/<a:p[^>]*>(.*?)<\/a:p>/gs);
  if (paragraphMatches) {
    console.log(`📝 Found ${paragraphMatches.length} <a:p> paragraphs`);
    paragraphMatches.forEach(match => {
      const innerTextMatches = match.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
      if (innerTextMatches) {
        innerTextMatches.forEach(innerMatch => {
          const text = innerMatch.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '').trim();
          if (text && text.length > 0 && !textElements.includes(text)) {
            textElements.push(text);
          }
        });
      }
    });
  }

  // Method 4: Try to extract any text content between XML tags as fallback
  if (textElements.length === 0) {
    console.log('🔍 No text found with standard methods, trying fallback extraction...');
    
    // Remove all XML tags and extract remaining text
    const cleanText = slideXml
      .replace(/<[^>]+>/g, ' ') // Remove all XML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    if (cleanText && cleanText.length > 10) { // Only if we have substantial text
      console.log(`📝 Fallback extraction found: "${cleanText.substring(0, 100)}..."`);
      textElements.push(cleanText);
    }
  }

  const finalText = textElements.join(' ').trim();
  console.log(`✅ Final extracted text (${finalText.length} chars): "${finalText.substring(0, 100)}${finalText.length > 100 ? '...' : ''}"`);
  
  return finalText;
}

/**
 * Extract slide notes from notes XML
 */
function extractNotesFromXml(notesXml) {
  if (!notesXml) return '';
  
  const textElements = [];
  const textMatches = notesXml.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
  
  if (textMatches) {
    textMatches.forEach(match => {
      const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '').trim();
      if (text && text.length > 0) {
        textElements.push(text);
      }
    });
  }

  return textElements.join(' ').trim();
}

/**
 * Enhanced: Extract content and text from PPTX (ZIP-based)
 */
export async function extractContentFromPPTX(pptBuffer, outputDir) {
  const JSZip = (await import('jszip')).default;
  const sharp = (await import('sharp')).default;

  try {
    await fs.mkdir(outputDir, { recursive: true });

    const zip = await JSZip.loadAsync(pptBuffer);
    const slides = [];

    // Get slide files
    const slideFiles = Object.keys(zip.files).filter(file =>
      file.startsWith('ppt/slides/slide') && file.endsWith('.xml')
    ).sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return aNum - bNum;
    });

    if (slideFiles.length === 0) {
      throw new Error('No slides found in PPTX file');
    }

    // Get notes files
    const notesFiles = Object.keys(zip.files).filter(file =>
      file.startsWith('ppt/notesSlides/') && file.endsWith('.xml')
    );

    // Extract embedded images
    const imageFiles = Object.keys(zip.files).filter(file =>
      file.startsWith('ppt/media/') &&
      (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.gif'))
    );

    // Save images to temp directory
    const imageMap = {};
    for (const imageFile of imageFiles) {
      const imageData = await zip.files[imageFile].async('nodebuffer');
      const imageName = path.basename(imageFile);
      const outputPath = path.join(outputDir, imageName);

      await fs.writeFile(outputPath, imageData);
      imageMap[imageFile] = outputPath;
    }

    // Process each slide
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideXml = await zip.files[slideFile].async('text');
      
      // Extract text content
      const slideText = extractTextFromSlideXml(slideXml);
      
      // Extract notes if available
      const notesFile = notesFiles.find(f => f.includes(`notesSlide${i + 1}.xml`));
      let slideNotes = '';
      if (notesFile && zip.files[notesFile]) {
        const notesXml = await zip.files[notesFile].async('text');
        slideNotes = extractNotesFromXml(notesXml);
      }

      // Create enhanced slide representation with text overlay
      const slideImagePath = path.join(outputDir, `slide_${i + 1}.png`);
      
      if (slideText || Object.keys(imageMap).length > 0) {
        // Create a slide with text content
        const slideWidth = 1920;
        const slideHeight = 1080;
        
        // Create SVG with text content
        const textLines = slideText.split(/[.!?]+/).filter(line => line.trim().length > 0);
        const maxLines = 10;
        const displayLines = textLines.slice(0, maxLines);
        
        let svgContent = `
          <svg width="${slideWidth}" height="${slideHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <style>
                .slide-bg { fill: #ffffff; }
                .slide-title { font-family: 'Segoe UI', Arial, sans-serif; font-size: 48px; font-weight: bold; fill: #1f2937; }
                .slide-text { font-family: 'Segoe UI', Arial, sans-serif; font-size: 32px; fill: #374151; }
                .slide-number { font-family: 'Segoe UI', Arial, sans-serif; font-size: 24px; fill: #6b7280; }
              </style>
            </defs>
            <rect width="100%" height="100%" class="slide-bg"/>
        `;

        // Add slide number
        svgContent += `<text x="50" y="50" class="slide-number">Slide ${i + 1}</text>`;

        // Add text content
        if (displayLines.length > 0) {
          const startY = 150;
          const lineHeight = 60;
          
          displayLines.forEach((line, lineIndex) => {
            const y = startY + (lineIndex * lineHeight);
            const truncatedLine = line.trim().substring(0, 80) + (line.trim().length > 80 ? '...' : '');
            
            svgContent += `<text x="100" y="${y}" class="${lineIndex === 0 ? 'slide-title' : 'slide-text'}">${escapeXml(truncatedLine)}</text>`;
          });
        }

        // Add notes indicator if available
        if (slideNotes) {
          svgContent += `<text x="100" y="${slideHeight - 100}" class="slide-number">📝 Speaker notes available</text>`;
        }

        svgContent += '</svg>';

        await sharp(Buffer.from(svgContent)).png().toFile(slideImagePath);
      } else {
        // Create a placeholder slide
        const placeholderSvg = `
          <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f9fafb"/>
            <text x="50%" y="45%" font-family="Arial" font-size="48" fill="#374151" text-anchor="middle" dy=".3em">
              Slide ${i + 1}
            </text>
            <text x="50%" y="55%" font-family="Arial" font-size="32" fill="#6b7280" text-anchor="middle" dy=".3em">
              No text content extracted
            </text>
          </svg>
        `;

        await sharp(Buffer.from(placeholderSvg)).png().toFile(slideImagePath);
      }

      slides.push({
        path: slideImagePath,
        slideNumber: i + 1,
        name: `slide_${i + 1}.png`,
        text: slideText,
        notes: slideNotes,
        hasImages: Object.keys(imageMap).length > 0
      });
    }

    if (slides.length === 0) {
      throw new Error('No slides could be extracted from the PPTX file');
    }

    return slides;

  } catch (error) {
    throw new Error(`PPTX content extraction failed: ${error.message}`);
  }
}

/**
 * Helper function to escape XML characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Fallback: Extract images and create slide representations from PPTX (ZIP-based)
 */
export async function extractImagesFromPPTX(pptBuffer, outputDir) {
  // Use the enhanced content extraction
  const slides = await extractContentFromPPTX(pptBuffer, outputDir);
  return slides.map(slide => slide.path);
}

/**
 * Main conversion function with multiple fallbacks
 */
export async function convertPPTToImages(pptBuffer, options = {}) {
  const {
    outputDir = './temp',
    maxRetries = 3,
    preferredMethod = 'libreoffice',
    format = 'png',
    resolution = 300
  } = options;

  const methods = [
    { name: 'libreoffice', func: convertWithLibreOffice },
    { name: 'extract', func: extractImagesFromPPTX },
    { name: 'python', func: convertWithPython },
    { name: 'online', func: convertWithOnlineService }
  ];

  // Reorder methods based on preference
  const orderedMethods = [
    methods.find(m => m.name === preferredMethod),
    ...methods.filter(m => m.name !== preferredMethod)
  ].filter(Boolean);

  let lastError;

  for (const method of orderedMethods) {
    try {
      console.log(`🔄 Trying conversion method: ${method.name}`);

      if (method.name === 'libreoffice') {
        const images = await method.func(pptBuffer, outputDir);
        return { method: 'libreoffice', images };
      }

      if (method.name === 'extract') {
        const images = await method.func(pptBuffer, outputDir);
        return { method: 'extract', images };
      }

      // For other methods (when implemented)
      const result = await method.func(pptBuffer, outputDir);
      return { method: method.name, result };

    } catch (error) {
      console.warn(`⚠️  ${method.name} conversion failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All conversion methods failed. Last error: ${lastError?.message}`);
}

/**
 * Convert PDF buffer to images using pdf-poppler
 */
export async function convertPDFToImages(pdfBuffer, outputDir, format = 'png', resolution = 300) {
  const tempPdfPath = path.join(outputDir, `temp_${Date.now()}.pdf`);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(tempPdfPath, pdfBuffer);

    // Get PDF info
    const pdfInfo = await execFileAsync('pdfinfo', [tempPdfPath]);
    const pagesMatch = pdfInfo.stdout.match(/Pages:\s+(\d+)/);
    const numPages = pagesMatch ? parseInt(pagesMatch[1]) : 1;

    // Convert to images with enhanced quality
    const pdfPoppler = (await import('pdf-poppler')).default;
    const options = {
      format: format,
      out_dir: outputDir,
      out_prefix: 'slide',
      page: null,
      resolution: resolution // Higher resolution for better quality
    };

    await pdfPoppler.convert(tempPdfPath, options);

    // Collect image files
    const slideFiles = [];
    for (let i = 1; i <= numPages; i++) {
      const slidePath = path.join(outputDir, `slide-${i.toString().padStart(2, '0')}.png`);
      try {
        await fs.access(slidePath);
        slideFiles.push(slidePath);
      } catch {
        const altSlidePath = path.join(outputDir, `slide-${i}.${format}`);
        try {
          await fs.access(altSlidePath);
          slideFiles.push(altSlidePath);
        } catch {
          console.warn(`Slide ${i} not found at ${slidePath} or ${altSlidePath}`);
        }
      }
    }

    return slideFiles;

  } finally {
    // Cleanup temp PDF
    try {
      await fs.unlink(tempPdfPath);
    } catch (error) {
      console.warn('Failed to cleanup temp PDF:', error.message);
    }
  }
}

/**
 * Check if a conversion method is available
 */
export async function checkConversionMethod(method) {
  try {
    switch (method) {
      case 'libreoffice':
        // Try to run soffice with full path or check if libreoffice-convert is available
        try {
          const sofficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
          await execFileAsync(sofficePath, ['--version']);
          return true;
        } catch {
          // Check if libreoffice-convert package is available
          try {
            await import('libreoffice-convert');
            return true;
          } catch {
            return false;
          }
        }

      case 'python':
        // Check if python-pptx is available (not implemented yet)
        return false;

      case 'online':
        // Check if API keys are configured (not implemented yet)
        return false;

      case 'extract':
        // Always available for PPTX files (uses JSZip and Sharp)
        return true;

      default:
        return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Get available conversion methods
 */
export async function getAvailableMethods() {
  const methods = ['libreoffice', 'python', 'online', 'extract'];
  const available = {};

  for (const method of methods) {
    available[method] = await checkConversionMethod(method);
  }

  return available;
}

/**
 * Enhanced conversion that preserves original PowerPoint content
 */
export async function convertAndUploadToS3(pptBuffer, cacheKey, options = {}) {
  try {
    console.log('🚀 Starting PowerPoint conversion with original content preservation...');
    
    // Use PPT → PDF → Images approach to preserve original content
    const { convertPowerPointWithOriginalContent } = await import('./reliablePptConverter.js');
    
    // Convert while preserving original visual content
    const conversionResult = await convertPowerPointWithOriginalContent(pptBuffer, cacheKey, options);
    
    console.log(`✅ Conversion successful using method: ${conversionResult.method}`);
    console.log(`📊 Generated ${conversionResult.totalSlides} slides with original content`);
    
    // Format slides for API response
    const slidesWithText = conversionResult.slides.map(slide => ({
      slideNumber: slide.slideNumber,
      imageUrl: slide.imageUrl,
      s3Key: null,
      size: 0,
      path: slide.imagePath,
      text: slide.text || '',
      notes: slide.notes || '',
      hasImages: true // Always true since we preserve original content
    }));

    console.log('📋 Final slides with original content and text:', slidesWithText.map(s => ({
      slide: s.slideNumber,
      hasOriginalContent: true,
      hasText: !!s.text,
      textLength: s.text?.length || 0,
      textPreview: s.text?.substring(0, 50) + '...' || 'Extracted from original slide'
    })));

    // Generate thumbnail from first slide
    const thumbnail = {
      url: slidesWithText[0]?.imageUrl || null,
      key: null,
      size: 0
    };

    return {
      slides: slidesWithText,
      thumbnail: thumbnail,
      method: conversionResult.method,
      totalSlides: slidesWithText.length
    };

  } catch (error) {
    console.error('❌ PowerPoint conversion failed:', error);
    throw error;
  }
}