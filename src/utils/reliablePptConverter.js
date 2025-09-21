/**
 * Reliable PowerPoint Converter
 * Uses multiple methods to ensure text extraction works
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Method 1: Convert PPT to PDF, then PDF to images with text extraction
 */
export async function convertViaPDF(pptBuffer, outputDir) {
  const tempPptPath = path.join(outputDir, `temp_${Date.now()}.pptx`);
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(tempPptPath, pptBuffer);

    console.log('🔄 Converting PowerPoint to PDF for text extraction...');

    // Convert to PDF using LibreOffice
    const sofficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
    
    await execFileAsync(sofficePath, [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      outputDir,
      tempPptPath
    ]);

    // Find the generated PDF
    const files = await fs.readdir(outputDir);
    const pdfFile = files.find(file => file.endsWith('.pdf'));
    
    if (!pdfFile) {
      throw new Error('PDF conversion failed - no PDF file generated');
    }

    const pdfPath = path.join(outputDir, pdfFile);
    console.log('✅ PDF created successfully:', pdfFile);

    // Now convert PDF to images using pdf-poppler (already installed)
    const pdfPoppler = (await import('pdf-poppler')).default;
    
    const options = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: 'slide',
      page: null,
      resolution: 200
    };

    await pdfPoppler.convert(pdfPath, options);
    console.log('✅ PDF converted to images');

    // Collect the generated images
    const updatedFiles = await fs.readdir(outputDir);
    const imageFiles = updatedFiles
      .filter(file => file.startsWith('slide') && file.endsWith('.png'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });

    console.log(`📸 Generated ${imageFiles.length} slide images`);

    // Extract text from PDF using simple text extraction
    let extractedText = '';
    try {
      // Try to extract text using a simple method
      const pdfBuffer = await fs.readFile(pdfPath);
      
      // Simple text extraction - look for text patterns in PDF
      const pdfString = pdfBuffer.toString('binary');
      const textMatches = pdfString.match(/\(([^)]+)\)/g);
      
      if (textMatches) {
        extractedText = textMatches
          .map(match => match.replace(/[()]/g, ''))
          .filter(text => text.length > 2 && /[a-zA-Z]/.test(text))
          .join(' ');
      }
      
      console.log(`📝 Extracted text (${extractedText.length} chars):`, extractedText.substring(0, 200) + '...');
      
    } catch (textError) {
      console.warn('Text extraction from PDF failed:', textError.message);
      extractedText = '';
    }

    // Create slides with images and text
    const slides = imageFiles.map((file, index) => {
      const imagePath = path.join(outputDir, file);
      const relativePath = path.relative(path.join(process.cwd(), 'public'), imagePath);
      const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;
      
      // Distribute text across slides (simple approach)
      const textPerSlide = Math.ceil(extractedText.length / imageFiles.length);
      const slideText = extractedText.substring(
        index * textPerSlide, 
        (index + 1) * textPerSlide
      ).trim();

      return {
        slideNumber: index + 1,
        imageUrl: publicUrl,
        imagePath: imagePath,
        text: slideText,
        notes: '',
        hasImages: true,
        hasText: !!slideText
      };
    });

    // Cleanup PDF
    try {
      await fs.unlink(pdfPath);
      await fs.unlink(tempPptPath);
    } catch (cleanupError) {
      console.warn('Cleanup failed:', cleanupError.message);
    }

    return {
      slides: slides,
      method: 'pdf-conversion',
      totalSlides: slides.length
    };

  } catch (error) {
    throw new Error(`PDF conversion method failed: ${error.message}`);
  }
}

/**
 * Method 2: Enhanced PPTX text extraction with better XML parsing
 */
export async function extractTextFromPPTX(pptBuffer, outputDir) {
  const JSZip = (await import('jszip')).default;
  const sharp = (await import('sharp')).default;

  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    console.log('🔍 Extracting text from PPTX using enhanced XML parsing...');
    
    const zip = await JSZip.loadAsync(pptBuffer);
    const slides = [];

    // Get all slide files
    const slideFiles = Object.keys(zip.files)
      .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return aNum - bNum;
      });

    console.log(`📄 Found ${slideFiles.length} slide files`);

    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideXml = await zip.files[slideFile].async('text');
      
      console.log(`\n🔍 Processing slide ${i + 1}...`);
      
      // Enhanced text extraction with multiple methods
      let slideText = '';
      
      // Method 1: Extract from <a:t> tags
      const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
      if (textMatches) {
        const texts = textMatches.map(match => {
          return match
            .replace(/<a:t[^>]*>/, '')
            .replace(/<\/a:t>/, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .trim();
        }).filter(text => text.length > 0);
        
        slideText = texts.join(' ');
        console.log(`   📝 Method 1 found: "${slideText}"`);
      }
      
      // Method 2: If no text found, try extracting from text body elements
      if (!slideText) {
        const txBodyMatches = slideXml.match(/<p:txBody[^>]*>(.*?)<\/p:txBody>/gs);
        if (txBodyMatches) {
          const allTexts = [];
          txBodyMatches.forEach(txBody => {
            const innerTexts = txBody.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
            if (innerTexts) {
              innerTexts.forEach(innerText => {
                const cleanText = innerText
                  .replace(/<a:t[^>]*>/, '')
                  .replace(/<\/a:t>/, '')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .trim();
                if (cleanText) allTexts.push(cleanText);
              });
            }
          });
          slideText = allTexts.join(' ');
          console.log(`   📝 Method 2 found: "${slideText}"`);
        }
      }
      
      // Method 3: Fallback - extract any readable text
      if (!slideText) {
        const allTextContent = slideXml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Look for meaningful words (more than 2 chars, contains letters)
        const words = allTextContent.split(' ')
          .filter(word => word.length > 2 && /[a-zA-Z]/.test(word))
          .slice(0, 20); // Limit to first 20 meaningful words
        
        if (words.length > 0) {
          slideText = words.join(' ');
          console.log(`   📝 Method 3 found: "${slideText}"`);
        }
      }

      // Create slide image with text overlay
      const slideImagePath = path.join(outputDir, `slide_${i + 1}.png`);
      
      // Create a visual slide with the extracted text
      const slideWidth = 1920;
      const slideHeight = 1080;
      
      let svgContent = `
        <svg width="${slideWidth}" height="${slideHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>
              .slide-bg { fill: #ffffff; stroke: #e5e7eb; stroke-width: 2; }
              .slide-title { font-family: 'Arial', sans-serif; font-size: 64px; font-weight: bold; fill: #1f2937; text-anchor: middle; }
              .slide-text { font-family: 'Arial', sans-serif; font-size: 36px; fill: #374151; text-anchor: middle; }
              .slide-number { font-family: 'Arial', sans-serif; font-size: 24px; fill: #6b7280; }
            </style>
          </defs>
          <rect width="100%" height="100%" class="slide-bg"/>
          <text x="100" y="80" class="slide-number">Slide ${i + 1}</text>
      `;

      if (slideText) {
        // Split text into lines for better display
        const words = slideText.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
          if ((currentLine + word).length > 40) {
            if (currentLine) lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
          if (lines.length >= 8) break; // Limit to 8 lines
        }
        if (currentLine.trim()) lines.push(currentLine.trim());

        // Add text lines to SVG
        lines.forEach((line, lineIndex) => {
          const y = 300 + (lineIndex * 80);
          const fontSize = lineIndex === 0 ? 'slide-title' : 'slide-text';
          const escapedLine = line
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          
          svgContent += `<text x="50%" y="${y}" class="${fontSize}">${escapedLine}</text>`;
        });
      } else {
        svgContent += `<text x="50%" y="50%" class="slide-text">No text content found</text>`;
      }

      svgContent += '</svg>';

      await sharp(Buffer.from(svgContent)).png().toFile(slideImagePath);

      const relativePath = path.relative(path.join(process.cwd(), 'public'), slideImagePath);
      const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

      slides.push({
        slideNumber: i + 1,
        imageUrl: publicUrl,
        imagePath: slideImagePath,
        text: slideText,
        notes: '',
        hasImages: false,
        hasText: !!slideText
      });

      console.log(`✅ Slide ${i + 1} processed - Text: ${slideText ? 'YES' : 'NO'} (${slideText.length} chars)`);
    }

    return {
      slides: slides,
      method: 'enhanced-xml-extraction',
      totalSlides: slides.length
    };

  } catch (error) {
    throw new Error(`Enhanced PPTX extraction failed: ${error.message}`);
  }
}

/**
 * Main conversion function with multiple fallbacks
 */
export async function convertPowerPointReliably(pptBuffer, cacheKey, options = {}) {
  const tempDir = path.join(process.cwd(), 'public', 'temp', `reliable_convert_${Date.now()}`);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log('🚀 Starting reliable PowerPoint conversion...');
    
    // Try Method 1: PDF conversion (best for text extraction)
    try {
      console.log('📄 Attempting PDF-based conversion...');
      const result = await convertViaPDF(pptBuffer, tempDir + '_pdf');
      console.log('✅ PDF conversion successful!');
      return result;
      
    } catch (pdfError) {
      console.warn('⚠️ PDF conversion failed:', pdfError.message);
      
      // Try Method 2: Enhanced PPTX extraction
      try {
        console.log('📝 Attempting enhanced PPTX text extraction...');
        const result = await extractTextFromPPTX(pptBuffer, tempDir + '_xml');
        console.log('✅ Enhanced PPTX extraction successful!');
        return result;
        
      } catch (xmlError) {
        console.error('❌ Both conversion methods failed');
        throw new Error(`All methods failed. PDF: ${pdfError.message}, XML: ${xmlError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Reliable PowerPoint conversion failed:', error);
    throw error;
  }
}

/**
 * Convert PowerPoint preserving original content (images, layouts, formatting)
 * This uses PPT → PDF → Images to maintain visual fidelity
 */
export async function convertPowerPointWithOriginalContent(pptBuffer, cacheKey, options = {}) {
  const tempDir = path.join(process.cwd(), 'public', 'temp', `original_content_${Date.now()}`);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log('🎨 Starting PowerPoint conversion preserving original content...');
    console.log('📁 Working directory:', tempDir);
    
    // Step 1: Convert PowerPoint to PDF (preserves all original content)
    console.log('📄 Step 1: Converting PowerPoint to PDF...');
    const pdfResult = await convertViaPDF(pptBuffer, tempDir);
    
    // Step 2: Also extract text separately for search functionality
    console.log('📝 Step 2: Extracting text content for search...');
    let textData = [];
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(pptBuffer);
      
      // Get slide files for text extraction
      const slideFiles = Object.keys(zip.files)
        .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
        .sort((a, b) => {
          const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
          const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
          return aNum - bNum;
        });

      console.log(`📄 Found ${slideFiles.length} slides for text extraction`);

      // Extract text from each slide
      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slideXml = await zip.files[slideFile].async('text');
        
        // Extract text using existing function
        const slideText = extractTextFromSlideXml(slideXml);
        
        textData.push({
          slideNumber: i + 1,
          text: slideText,
          notes: '' // Could extract notes here if needed
        });
        
        console.log(`   📝 Slide ${i + 1}: ${slideText ? `"${slideText.substring(0, 50)}..."` : 'No text'}`);
      }
      
    } catch (textError) {
      console.warn('⚠️ Text extraction failed, continuing with visual-only slides:', textError.message);
      // Create empty text data for each slide
      textData = pdfResult.slides.map((_, index) => ({
        slideNumber: index + 1,
        text: '',
        notes: ''
      }));
    }
    
    // Step 3: Combine original visual content with extracted text
    console.log('🔗 Step 3: Combining visual content with text data...');
    const enhancedSlides = pdfResult.slides.map((slide, index) => {
      const textInfo = textData[index] || { text: '', notes: '' };
      
      return {
        slideNumber: slide.slideNumber,
        imageUrl: slide.imageUrl,
        imagePath: slide.imagePath,
        text: textInfo.text,
        notes: textInfo.notes,
        hasImages: true, // Always true since we preserve original content
        hasText: !!textInfo.text,
        isOriginalContent: true // Flag to indicate this preserves original formatting
      };
    });
    
    console.log('✅ Original content preservation completed!');
    console.log(`📊 Generated ${enhancedSlides.length} slides with original visuals and extracted text`);
    console.log('📋 Slide summary:', enhancedSlides.map(s => ({
      slide: s.slideNumber,
      hasOriginalVisuals: true,
      hasText: s.hasText,
      textLength: s.text?.length || 0
    })));
    
    return {
      slides: enhancedSlides,
      method: 'original-content-preservation',
      totalSlides: enhancedSlides.length
    };
    
  } catch (error) {
    console.error('❌ Original content preservation failed:', error);
    throw error;
  }
}

/**
 * Helper function to extract text from slide XML (reused from main converter)
 */
function extractTextFromSlideXml(slideXml) {
  const textElements = [];
  
  // Extract text from <a:t> tags (text runs)
  const textMatches = slideXml.match(/<a:t[^>]*>(.*?)<\/a:t>/gs);
  if (textMatches) {
    textMatches.forEach(match => {
      const text = match.replace(/<a:t[^>]*>/, '').replace(/<\/a:t>/, '').trim();
      if (text && text.length > 0) {
        textElements.push(text);
      }
    });
  }

  // Extract from <p:txBody> (text body elements)
  const txBodyMatches = slideXml.match(/<p:txBody[^>]*>(.*?)<\/p:txBody>/gs);
  if (txBodyMatches) {
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

  return textElements.join(' ').trim();
}