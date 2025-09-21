import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pdfPath = searchParams.get('pdfPath');
  const page = searchParams.get('page') || '1';

  if (!pdfPath) {
    console.log('No PDF path provided');
    return NextResponse.json({ error: 'PDF path is required' }, { status: 400 });
  }

  try {
    // Sanitize the PDF path
    const safePdfPath = path.normalize(pdfPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePdfPath = path.join(process.cwd(), 'public', safePdfPath);

    // Check if PDF file exists
    await fs.access(absolutePdfPath);

    // Generate cache key based on PDF path and page
    const stats = await fs.stat(absolutePdfPath);
    const cacheKey = crypto.createHash('md5').update(`${pdfPath}_page_${page}_${stats.mtime.getTime()}`).digest('hex');

    // Setup image cache directory
    const imageFileName = `pdf_page_${cacheKey}.png`;
    const imageDir = path.join(process.cwd(), 'public', 'temp', 'images');
    const imagePath = path.join(imageDir, imageFileName);
    const imageRelativePath = `/temp/images/${imageFileName}`;

    // Create the images directory if it doesn't exist
    await fs.mkdir(imageDir, { recursive: true });

    // Check if image already exists in cache
    let imageExists = false;
    try {
      await fs.access(imagePath);
      imageExists = true;
      console.log('✅ Found cached image file:', imageRelativePath);
    } catch (err) {
      console.log('🔄 No cached image file found, will convert PDF page');
    }

    // If image doesn't exist, convert PDF page to image
    if (!imageExists) {
      console.log(`🔄 Converting PDF page ${page} to image...`);

      try {
        // Use pdf2pic package for PDF-to-image conversion
        const { fromPath } = (await import('pdf2pic')).default;
        
        const convert = fromPath(absolutePdfPath, {
          density: 150,
          saveFilename: `page_${page}`,
          savePath: imageDir,
          format: 'png',
          width: 1200,
          height: 800,
          quality: 90
        });
        
        // Convert specific page (1-indexed)
        const result = await convert(parseInt(page), { responseType: 'image' });
        
        if (result && result.path) {
          // Move the generated file to our expected path
          await fs.rename(result.path, imagePath);
          console.log('✅ PDF page converted to image successfully:', imageRelativePath);
        } else {
          throw new Error('PDF conversion did not produce expected result');
        }

      } catch (pdf2picError) {
        console.log('⚠️ pdf2pic failed, trying pdf-poppler as fallback...');
        
        try {
          // Fallback to pdf-poppler
          const pdfPoppler = (await import('pdf-poppler')).default;
          
          const options = {
            format: 'png',
            out_dir: imageDir,
            out_prefix: `temp_page_${page}`,
            page: parseInt(page),
            single_file: true
          };
          
          await pdfPoppler.convert(absolutePdfPath, options);
          
          // Find the generated file and rename it
          const files = await fs.readdir(imageDir);
          const generatedFile = files.find(f => f.startsWith(`temp_page_${page}`));
          
          if (generatedFile) {
            await fs.rename(path.join(imageDir, generatedFile), imagePath);
            console.log('✅ PDF page converted using pdf-poppler:', imageRelativePath);
          } else {
            throw new Error('pdf-poppler conversion did not produce expected result');
          }
          
        } catch (popplerError) {
          console.error('Both pdf2pic and pdf-poppler failed:', { pdf2picError, popplerError });
          throw new Error('Failed to convert PDF page to image. Both conversion methods failed.');
        }
      }
    }

    // Return the image URL
    return NextResponse.json({
      success: true,
      imageUrl: imageRelativePath,
      page: parseInt(page),
      cacheKey: cacheKey
    });

  } catch (error) {
    console.error('Error converting PDF page to image:', error);

    if (error.code === 'ENOENT') {
      return NextResponse.json({
        error: 'PDF file not found',
        details: 'The PDF file could not be found. It may have been moved or deleted.'
      }, { status: 404 });
    }

    const details = error.message || 'An unexpected error occurred while converting the PDF page to image.';
    return NextResponse.json({
      error: 'Failed to convert PDF page to image',
      details
    }, { status: 500 });
  }
}

// Also create a batch endpoint for converting all pages at once
export async function POST(request) {
  try {
    const body = await request.text();
    console.log('Raw request body:', body);
    
    let pdfPath, totalPages;
    try {
      const parsed = JSON.parse(body);
      pdfPath = parsed.pdfPath;
      totalPages = parsed.totalPages;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }, { status: 400 });
    }

    if (!pdfPath || !totalPages) {
      return NextResponse.json({ error: 'PDF path and total pages are required' }, { status: 400 });
    }

    console.log('Converting PDF to images:', { pdfPath, totalPages });

    const imageUrls = [];
    const errors = [];

    // Convert each page to image
    for (let page = 1; page <= totalPages; page++) {
      try {
        // Use the same conversion logic as GET endpoint
        const safePdfPath = path.normalize(pdfPath).replace(/^(\.\.(\/|\\|$))+/, '');
        const absolutePdfPath = path.join(process.cwd(), 'public', safePdfPath);
        
        // Generate cache key for this page
        const stats = await fs.stat(absolutePdfPath);
        const cacheKey = crypto.createHash('md5').update(`${pdfPath}_page_${page}_${stats.mtime.getTime()}`).digest('hex');
        const imageFileName = `pdf_page_${cacheKey}.png`;
        const imageDir = path.join(process.cwd(), 'public', 'temp', 'images');
        const imagePath = path.join(imageDir, imageFileName);
        const imageRelativePath = `/temp/images/${imageFileName}`;
        
        // Check if already exists
        let imageExists = false;
        try {
          await fs.access(imagePath);
          imageExists = true;
        } catch (err) {
          // Need to convert
        }
        
        if (!imageExists) {
          // Convert this page
          try {
            const { fromPath } = (await import('pdf2pic')).default;
            
            const convert = fromPath(absolutePdfPath, {
              density: 150,
              saveFilename: `page_${page}`,
              savePath: imageDir,
              format: 'png',
              width: 1200,
              height: 800,
              quality: 90
            });
            
            const result = await convert(parseInt(page), { responseType: 'image' });
            
            if (result && result.path) {
              await fs.rename(result.path, imagePath);
            } else {
              throw new Error('PDF conversion did not produce expected result');
            }
          } catch (conversionError) {
            // Try fallback method
            const pdfPoppler = (await import('pdf-poppler')).default;
            
            const options = {
              format: 'png',
              out_dir: imageDir,
              out_prefix: `temp_page_${page}`,
              page: parseInt(page),
              single_file: true
            };
            
            await pdfPoppler.convert(absolutePdfPath, options);
            
            const files = await fs.readdir(imageDir);
            const generatedFile = files.find(f => f.startsWith(`temp_page_${page}`));
            
            if (generatedFile) {
              await fs.rename(path.join(imageDir, generatedFile), imagePath);
            } else {
              throw new Error('Fallback conversion failed');
            }
          }
        }
        
        imageUrls.push({
          page: page,
          imageUrl: imageRelativePath
        });
        
      } catch (pageError) {
        errors.push({
          page: page,
          error: pageError.message
        });
      }
    }

    return NextResponse.json({
      success: imageUrls.length > 0,
      imageUrls,
      errors: errors.length > 0 ? errors : null,
      totalConverted: imageUrls.length,
      totalPages
    });

  } catch (error) {
    console.error('Error in batch PDF to images conversion:', error);
    return NextResponse.json({
      error: 'Failed to batch convert PDF pages',
      details: error.message
    }, { status: 500 });
  }
}