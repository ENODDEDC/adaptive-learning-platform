/**
 * PowerPoint to PDF Conversion Utility
 * This converts PPT/PPTX to PDF first, then extracts content
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Convert PowerPoint to PDF using LibreOffice
 */
export async function convertPPTToPDF(pptBuffer, outputDir) {
  const tempPptPath = path.join(outputDir, `temp_${Date.now()}.pptx`);
  const pdfOutputPath = path.join(outputDir, `converted_${Date.now()}.pdf`);

  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write PPT buffer to temp file
    await fs.writeFile(tempPptPath, pptBuffer);

    console.log('🔄 Converting PowerPoint to PDF...');

    // Try LibreOffice conversion to PDF
    try {
      const sofficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';

      await execFileAsync(sofficePath, [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        tempPptPath
      ]);

      // Find the generated PDF file
      const files = await fs.readdir(outputDir);
      const pdfFile = files.find(file => file.endsWith('.pdf') && file.startsWith('temp_'));
      
      if (!pdfFile) {
        throw new Error('No PDF file was generated');
      }

      const generatedPdfPath = path.join(outputDir, pdfFile);
      
      // Rename to our expected name
      await fs.rename(generatedPdfPath, pdfOutputPath);
      
      console.log('✅ PowerPoint converted to PDF successfully');
      return pdfOutputPath;

    } catch (libreError) {
      console.warn('LibreOffice PDF conversion failed:', libreError.message);
      
      // Fallback: Try using libreoffice-convert package
      try {
        const libreOfficeConvert = (await import('libreoffice-convert')).default;
        
        const pdfBuffer = await libreOfficeConvert.convertAsync(pptBuffer, '.pdf', undefined);
        await fs.writeFile(pdfOutputPath, pdfBuffer);
        
        console.log('✅ PowerPoint converted to PDF using libreoffice-convert');
        return pdfOutputPath;
        
      } catch (convertError) {
        throw new Error(`Both LibreOffice methods failed. Direct: ${libreError.message}, Package: ${convertError.message}`);
      }
    }

  } catch (error) {
    throw new Error(`PowerPoint to PDF conversion failed: ${error.message}`);
  } finally {
    // Cleanup temp PPT file
    try {
      await fs.unlink(tempPptPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp PPT file:', cleanupError.message);
    }
  }
}

/**
 * Convert PDF to images and extract text using pdf2pic and pdf-parse
 */
export async function convertPDFToImagesAndText(pdfPath, outputDir) {
  try {
    console.log('🔄 Converting PDF to images and extracting text...');
    
    // Method 1: Try using pdf2pic for images
    let images = [];
    try {
      const pdf2pic = (await import('pdf2pic')).default;
      
      const convert = pdf2pic.fromPath(pdfPath, {
        density: 200,           // High quality
        saveFilename: "slide",
        savePath: outputDir,
        format: "png",
        width: 1920,
        height: 1080
      });

      const results = await convert.bulk(-1); // Convert all pages
      
      images = results.map((result, index) => ({
        slideNumber: index + 1,
        imagePath: result.path,
        imageUrl: `/${path.relative(path.join(process.cwd(), 'public'), result.path).replace(/\\/g, '/')}`
      }));
      
      console.log(`✅ Generated ${images.length} slide images`);
      
    } catch (pdf2picError) {
      console.warn('pdf2pic failed, trying alternative method:', pdf2picError.message);
      
      // Fallback: Use pdf-poppler
      try {
        const pdfPoppler = (await import('pdf-poppler')).default;
        
        const options = {
          format: 'png',
          out_dir: outputDir,
          out_prefix: 'slide',
          page: null,
          resolution: 200
        };

        await pdfPoppler.convert(pdfPath, options);
        
        // Collect generated images
        const files = await fs.readdir(outputDir);
        const imageFiles = files
          .filter(file => file.startsWith('slide') && file.endsWith('.png'))
          .sort((a, b) => {
            const aNum = parseInt(a.match(/\d+/)?.[0] || '0');
            const bNum = parseInt(b.match(/\d+/)?.[0] || '0');
            return aNum - bNum;
          });

        images = imageFiles.map((file, index) => {
          const imagePath = path.join(outputDir, file);
          return {
            slideNumber: index + 1,
            imagePath: imagePath,
            imageUrl: `/${path.relative(path.join(process.cwd(), 'public'), imagePath).replace(/\\/g, '/')}`
          };
        });
        
        console.log(`✅ Generated ${images.length} slide images using pdf-poppler`);
        
      } catch (popplerError) {
        throw new Error(`Both image conversion methods failed. pdf2pic: ${pdf2picError.message}, poppler: ${popplerError.message}`);
      }
    }

    // Method 2: Extract text from PDF
    let textContent = [];
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const pdfBuffer = await fs.readFile(pdfPath);
      
      const data = await pdfParse(pdfBuffer);
      
      console.log(`📝 Extracted text from PDF: ${data.text.length} characters`);
      
      // Split text by pages (rough estimation)
      const totalPages = images.length;
      const textPerPage = Math.ceil(data.text.length / totalPages);
      
      for (let i = 0; i < totalPages; i++) {
        const startIndex = i * textPerPage;
        const endIndex = Math.min((i + 1) * textPerPage, data.text.length);
        const pageText = data.text.substring(startIndex, endIndex).trim();
        
        textContent.push({
          slideNumber: i + 1,
          text: pageText,
          notes: '' // PDF doesn't contain speaker notes
        });
      }
      
    } catch (textError) {
      console.warn('Text extraction from PDF failed:', textError.message);
      
      // Create empty text content for each slide
      textContent = images.map((_, index) => ({
        slideNumber: index + 1,
        text: '',
        notes: ''
      }));
    }

    // Combine images and text
    const slides = images.map((image, index) => ({
      slideNumber: image.slideNumber,
      imageUrl: image.imageUrl,
      imagePath: image.imagePath,
      text: textContent[index]?.text || '',
      notes: textContent[index]?.notes || '',
      hasImages: true,
      hasText: !!(textContent[index]?.text)
    }));

    console.log(`✅ Created ${slides.length} slides with images and text`);
    
    return slides;

  } catch (error) {
    throw new Error(`PDF to images and text conversion failed: ${error.message}`);
  }
}

/**
 * Main function: Convert PowerPoint to viewable slides with text
 */
export async function convertPowerPointToSlides(pptBuffer, cacheKey, options = {}) {
  const tempDir = path.join(process.cwd(), 'public', 'temp', `ppt_convert_${Date.now()}`);
  
  try {
    await fs.mkdir(tempDir, { recursive: true });
    
    console.log('🚀 Starting PowerPoint conversion process...');
    
    // Step 1: Convert PowerPoint to PDF
    const pdfPath = await convertPPTToPDF(pptBuffer, tempDir);
    
    // Step 2: Convert PDF to images and extract text
    const slides = await convertPDFToImagesAndText(pdfPath, tempDir);
    
    // Step 3: Cleanup PDF file
    try {
      await fs.unlink(pdfPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup PDF file:', cleanupError.message);
    }
    
    console.log('🎉 PowerPoint conversion completed successfully!');
    
    return {
      slides: slides,
      totalSlides: slides.length,
      method: 'ppt-to-pdf-to-images',
      thumbnail: slides[0]?.imageUrl || null
    };
    
  } catch (error) {
    console.error('❌ PowerPoint conversion failed:', error);
    throw error;
  }
}