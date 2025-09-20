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

    // Convert PPTX to PNG using LibreOffice
    await execFileAsync('soffice', [
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
 * Fallback: Extract images directly from PPTX (ZIP-based)
 */
export async function extractImagesFromPPTX(pptBuffer, outputDir) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(pptBuffer);

  const images = [];
  const imageFiles = Object.keys(zip.files).filter(file =>
    file.startsWith('ppt/media/') &&
    (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'))
  );

  for (const imageFile of imageFiles) {
    const imageData = await zip.files[imageFile].async('nodebuffer');
    const imageName = path.basename(imageFile);
    const outputPath = path.join(outputDir, imageName);

    await fs.writeFile(outputPath, imageData);
    images.push({
      path: outputPath,
      name: imageName,
      data: imageData
    });
  }

  return images;
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
        // Try to run soffice --version
        await execFileAsync('soffice', ['--version']);
        return true;

      case 'python':
        // Check if python-pptx is available (not implemented yet)
        return false;

      case 'online':
        // Check if API keys are configured (not implemented yet)
        return false;

      case 'extract':
        // Always available for PPTX files
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
 * Convert and save images locally (no S3 upload)
 */
export async function convertAndUploadToS3(pptBuffer, cacheKey, options = {}) {
  const {
    preferredMethod = 'libreoffice',
    quality = 95,
    thumbnailQuality = 85,
    resolution = 300,
    format = format,
    optimizeForWeb = true
  } = options;

  try {
    // Create temp directory
    const tempDir = path.join(process.cwd(), 'public', 'temp', `convert_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Convert PPT to images
    const conversionResult = await convertPPTToImages(pptBuffer, {
      outputDir: tempDir,
      preferredMethod: preferredMethod,
      format: format,
      resolution: 250,
      quality: 85
    });

    console.log(`✅ Conversion successful using method: ${conversionResult.method}`);

    const { images } = conversionResult;

    if (!images || images.length === 0) {
      throw new Error('No images were extracted from the presentation');
    }

    // Instead of S3 upload, create local URLs
    const localSlides = images.map((imagePath, index) => {
      const actualPath = typeof imagePath === 'string' ? imagePath : (imagePath.path || String(imagePath));
      
      // Create a URL that serves from the temp directory
      const relativePath = path.relative(path.join(process.cwd(), 'public'), actualPath);
      const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

      return {
        slideNumber: index + 1,
        imageUrl: publicUrl,
        s3Key: null, // No S3
        size: 0, // Will be calculated if needed
        path: actualPath
      };
    });

    // Generate thumbnail from first slide
    const firstSlide = localSlides[0];
    const thumbnail = {
      url: firstSlide.imageUrl,
      key: null,
      size: 0
    };

    return {
      slides: localSlides,
      thumbnail: thumbnail,
      method: conversionResult.method,
      totalSlides: localSlides.length
    };

  } catch (error) {
    console.error('❌ PPT conversion failed:', error);
    throw error;
  }
}