import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Content from '../../../models/Content';
import { convertAndUploadToS3 } from '../../../utils/pptConverter';
import sharp from 'sharp';

// Helper function to generate HTML viewer
function generateHtmlViewer(slidesHtml, totalSlides, thumbnailUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PowerPoint Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
        }
        .viewer-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .viewer-header {
            padding: 16px 20px;
            border-bottom: 1px solid #e1e5e9;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
        }
        .slide-counter {
            font-weight: 500;
            color: #374151;
        }
        .controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .btn {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
        }
        .btn:hover:not(:disabled) {
            background: #f3f4f6;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .slide-container {
            position: relative;
            height: 600px;
            overflow: hidden;
        }
        .slide {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
        }
        .slide.active {
            display: flex;
        }
        .slide-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .thumbnail-sidebar {
            position: fixed;
            right: 20px;
            top: 100px;
            width: 150px;
            max-height: 70vh;
            overflow-y: auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 12px;
        }
        .thumbnail {
            width: 100%;
            margin-bottom: 8px;
            border-radius: 4px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: border-color 0.2s;
        }
        .thumbnail:hover {
            border-color: #3b82f6;
        }
        .thumbnail.active {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        @media (max-width: 768px) {
            .thumbnail-sidebar {
                display: none;
            }
            .viewer-container {
                margin: 0;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="viewer-container">
        <div class="viewer-header">
            <div class="slide-counter">Slide <span id="current-slide">1</span> of <span id="total-slides">${totalSlides}</span></div>
            <div class="controls">
                <button class="btn" id="prev-btn" disabled>&larr; Previous</button>
                <button class="btn" id="next-btn">Next &rarr;</button>
                <button class="btn" id="fullscreen-btn">⛶ Fullscreen</button>
            </div>
        </div>
        <div class="slide-container" id="slide-container">
            ${slidesHtml}
        </div>
    </div>

    <div class="thumbnail-sidebar" id="thumbnail-sidebar">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">Slides</h4>
        ${Array.from({ length: totalSlides }, (_, index) => {
    const slideUrl = thumbnailUrl; // Use thumbnail for all thumbnails for simplicity
    return `<img src="${slideUrl}" class="thumbnail ${index === 0 ? 'active' : ''}" data-slide="${index + 1}" alt="Slide ${index + 1}" />`;
  }).join('')}
    </div>

    <script>
        let currentSlide = 1;
        const totalSlides = ${totalSlides};
        const slides = document.querySelectorAll('.slide');
        const thumbnails = document.querySelectorAll('.thumbnail');
        const currentSlideSpan = document.getElementById('current-slide');
        const totalSlidesSpan = document.getElementById('total-slides');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        function showSlide(slideNumber) {
            // Hide all slides
            slides.forEach(slide => slide.classList.remove('active'));
            thumbnails.forEach(thumb => thumb.classList.remove('active'));

            // Show current slide
            const slideElement = document.querySelector(\`[data-slide="\${slideNumber}"]\`);
            const thumbElement = document.querySelector(\`.thumbnail[data-slide="\${slideNumber}"]\`);

            if (slideElement) slideElement.classList.add('active');
            if (thumbElement) thumbElement.classList.add('active');

            currentSlide = slideNumber;
            currentSlideSpan.textContent = currentSlide;

            // Update button states
            prevBtn.disabled = currentSlide === 1;
            nextBtn.disabled = currentSlide === totalSlides;
        }

        function nextSlide() {
            if (currentSlide < totalSlides) {
                showSlide(currentSlide + 1);
            }
        }

        function prevSlide() {
            if (currentSlide > 1) {
                showSlide(currentSlide - 1);
            }
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        // Event listeners
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);
        fullscreenBtn.addEventListener('click', toggleFullscreen);

        // Thumbnail click handlers
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                const slideNumber = parseInt(thumbnail.dataset.slide);
                showSlide(slideNumber);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    nextSlide();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    prevSlide();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
            }
        });

        // Initialize first slide
        showSlide(1);
    </script>
</body>
</html>`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');
  const contentId = searchParams.get('contentId');
  const format = searchParams.get('format') || 'json'; // json or html

  if (!filePath) {
    console.log('No file path provided');
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

  try {
    // Check if file exists
    await fs.access(absolutePath);

    // Check file extension
    const ext = path.extname(absolutePath).toLowerCase();
    if (!['.ppt', '.pptx'].includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file format. Only .ppt and .pptx files are supported.' }, { status: 400 });
    }

    // Choose conversion method based on file type for optimal performance
    // Use LibreOffice for better quality, extract as fallback
    const preferredMethod = ext === '.pptx' ? 'libreoffice' : 'libreoffice';

    // Get file stats for cache key generation
    const stats = await fs.stat(absolutePath);
    const cacheKey = crypto.createHash('md5').update(`${filePath}_${stats.mtime.getTime()}`).digest('hex');

    // Check if content is already converted in database
    let content = null;
    if (contentId) {
      content = await Content.findById(contentId);
      if (content && content.slidesData && content.slidesData.length > 0 && content.conversionStatus === 'completed') {
        console.log('Using cached conversion from database');

        if (format === 'json') {
          return NextResponse.json({
            success: true,
            totalSlides: content.totalSlides,
            thumbnail: content.slidesData[0]?.imageUrl,
            slides: content.slidesData.map(slide => ({
              slideNumber: slide.slideNumber,
              imageUrl: slide.imageUrl,
              width: slide.width,
              height: slide.height,
              size: slide.size,
              text: slide.text || '',
              notes: slide.notes || '',
              hasImages: slide.hasImages || false,
            })),
            cached: true,
            cacheKey: content.cacheKey,
          });
        } else {
          // Return HTML with cloud URLs
          const slidesHtml = content.slidesData.map((slide, index) => `
            <div class="slide" data-slide="${index + 1}">
              <img src="${slide.imageUrl}" alt="Slide ${index + 1}" class="slide-image" loading="lazy" />
            </div>
          `).join('');

          const html = generateHtmlViewer(slidesHtml, content.totalSlides, content.slidesData[0]?.imageUrl);
          return new NextResponse(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      }
    }

    // Skip local cache check for now - focus on cloud-based conversion
    // TODO: Implement cloud-based caching if needed

    // Update content status to processing
    if (contentId && content) {
      await Content.findByIdAndUpdate(contentId, {
        conversionStatus: 'processing',
        cacheKey: cacheKey
      });
    }

    // Read the PPT file
    const pptBuffer = await fs.readFile(absolutePath);

    console.log(`🔄 Starting PPT conversion for file: ${filePath}`);
    console.log(`📊 File size: ${pptBuffer.length} bytes`);

    // Convert PPT to images with text extraction enabled
    const conversionResult = await convertAndUploadToS3(pptBuffer, cacheKey, {
      preferredMethod: 'extract', // Force text extraction method
      quality: 85,
      thumbnailQuality: 80,
      resolution: 200,
      format: 'png', // PNG for better text quality
      optimizeForWeb: true
    });

    console.log(`✅ Conversion completed using method: ${conversionResult.method}`);
    console.log(`📸 Generated ${conversionResult.totalSlides} slides`);

    const { slides, thumbnail } = conversionResult;

    // Prepare slides data for database
    const slidesData = slides.map(slide => ({
      slideNumber: slide.slideNumber,
      imageUrl: slide.imageUrl,
      s3Key: slide.s3Key,
      width: 1920, // Default dimensions (could be extracted from Sharp)
      height: 1080,
      size: slide.size,
      text: slide.text || '', // Extracted text content
      notes: slide.notes || '', // Speaker notes
      hasImages: slide.hasImages || false, // Whether slide contains images
    }));

    // Update content in database
    if (contentId && content) {
      await Content.findByIdAndUpdate(contentId, {
        slidesData: slidesData,
        totalSlides: conversionResult.totalSlides,
        thumbnailUrl: thumbnail?.url || slides[0]?.imageUrl,
        conversionStatus: 'completed',
        cacheKey: cacheKey,
        conversionError: null
      });
    }

    // Return response based on format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        totalSlides: conversionResult.totalSlides,
        thumbnail: thumbnail?.url || slides[0]?.imageUrl,
        slides: slidesData.map(slide => ({
          slideNumber: slide.slideNumber,
          imageUrl: slide.imageUrl,
          width: slide.width,
          height: slide.height,
          size: slide.size,
          text: slide.text || '',
          notes: slide.notes || '',
          hasImages: slide.hasImages || false,
        })),
        cached: false,
        cacheKey: cacheKey,
        method: conversionResult.method,
      });
    } else {
      // Return HTML viewer with cloud URLs
      const slidesHtml = slidesData.map((slide, index) => `
        <div class="slide" data-slide="${index + 1}">
          <img src="${slide.imageUrl}" alt="Slide ${index + 1}" class="slide-image" loading="lazy" />
        </div>
      `).join('');

      const html = generateHtmlViewer(slidesHtml, conversionResult.totalSlides, thumbnail?.url || slides[0]?.imageUrl);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

  } catch (error) {
    console.error('Error processing PPT file:', error);

    // Update content status to failed if we have a contentId
    if (contentId) {
      try {
        await Content.findByIdAndUpdate(contentId, {
          conversionStatus: 'failed',
          conversionError: error.message
        });
      } catch (dbError) {
        console.error('Failed to update content status:', dbError);
      }
    }

    if (error.code === 'ENOENT') {
      return NextResponse.json({
        error: 'File not found',
        details: 'The PowerPoint file could not be found. It may have been moved or deleted.'
      }, { status: 404 });
    }

    if (error.message && error.message.includes('LibreOffice')) {
      return NextResponse.json({
        error: 'Conversion service unavailable',
        details: 'LibreOffice is not available on the server. Please try downloading the file and opening it in PowerPoint directly.'
      }, { status: 500 });
    }

    if (error.message && error.message.includes('No slides')) {
      return NextResponse.json({
        error: 'Empty presentation',
        details: 'The presentation file appears to be empty or contains no slides.'
      }, { status: 400 });
    }

    if (error.message && error.message.includes('corrupted')) {
      return NextResponse.json({
        error: 'Corrupted file',
        details: 'The PowerPoint file appears to be corrupted. Please try uploading a different version of the file.'
      }, { status: 400 });
    }

    const details = error.message || 'An unexpected error occurred while processing the presentation.';
    return NextResponse.json({
      error: 'Failed to process PowerPoint file',
      details
    }, { status: 500 });
  }
}