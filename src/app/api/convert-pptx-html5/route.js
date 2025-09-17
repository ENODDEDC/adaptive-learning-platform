import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import JSZip from 'jszip';
import { DOMParser } from 'xmldom';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('filePath');

  if (!filePath) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // Prevent directory traversal attacks
  const safeSuffix = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolutePath = path.join(process.cwd(), 'public', safeSuffix);

  try {
    // Check if file exists
    await fs.access(absolutePath);

    console.log('Starting simple PPTX to HTML5 conversion for:', absolutePath);

    // Extract content from PPTX using simple approach
    const slides = await extractPptxContent(absolutePath);
    
    if (!slides || slides.length === 0) {
      console.log('No slides found, generating fallback');
      const fallbackHtml = generateFallbackHTML(absolutePath);
      return new NextResponse(fallbackHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    console.log(`Extracted ${slides.length} slides`);

    // Generate clean presentation HTML
    const htmlContent = generatePresentationHTML(slides);

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error converting PPTX to HTML5:', error);
    
    // Return fallback HTML
    const fallbackHtml = generateFallbackHTML(absolutePath);
    return new NextResponse(fallbackHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

async function extractPptxContent(filePath) {
  try {
    // Read the PPTX file as a ZIP
    const pptxBuffer = await fs.readFile(filePath);
    const zip = await JSZip.loadAsync(pptxBuffer);
    
    // Extract images first
    const images = await extractImages(zip);
    console.log(`Extracted ${Object.keys(images).length} images`);
    
    // Extract slide relationships
    const relationships = await extractRelationships(zip);
    
    // Find slide files
    const slideFiles = Object.keys(zip.files)
      .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)/)[1]);
        const bNum = parseInt(b.match(/slide(\d+)/)[1]);
        return aNum - bNum;
      });

    console.log(`Found ${slideFiles.length} slide files`);

    const slides = [];
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideNumber = i + 1;
      
      try {
        const slideXml = await zip.file(slideFile).async('string');
        const slideRelationships = relationships[`ppt/slides/_rels/slide${slideNumber}.xml.rels`] || {};
        const slideData = parseSlideXML(slideXml, slideNumber, slideRelationships, images);
        
        if (slideData) {
          slides.push(slideData);
        }
      } catch (error) {
        console.warn(`Error processing slide ${slideNumber}:`, error.message);
        // Add a fallback slide
        slides.push({
          number: slideNumber,
          title: `Slide ${slideNumber}`,
          content: 'Content could not be extracted',
          images: [],
          layout: 'title-content'
        });
      }
    }
    
    return slides;
    
  } catch (error) {
    console.error('Error extracting PPTX content:', error);
    return null;
  }
}

async function extractImages(zip) {
  const images = {};
  const imageFiles = Object.keys(zip.files).filter(file => 
    file.startsWith('ppt/media/') && 
    /\.(png|jpg|jpeg|gif|bmp|svg|emf|wmf)$/i.test(file)
  );

  for (const imageFile of imageFiles) {
    try {
      const imageBuffer = await zip.file(imageFile).async('nodebuffer');
      const fileName = path.basename(imageFile);
      const base64 = imageBuffer.toString('base64');
      const mimeType = getMimeType(path.extname(fileName));
      
      images[fileName] = `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.warn(`Error extracting image ${imageFile}:`, error.message);
    }
  }
  
  return images;
}

async function extractRelationships(zip) {
  const relationships = {};
  const relFiles = Object.keys(zip.files).filter(file => 
    file.includes('_rels/') && file.endsWith('.xml.rels')
  );

  for (const relFile of relFiles) {
    try {
      const relXml = await zip.file(relFile).async('string');
      const parser = new DOMParser();
      const doc = parser.parseFromString(relXml, 'text/xml');
      
      const rels = {};
      const relElements = doc.getElementsByTagName('Relationship');
      
      for (let i = 0; i < relElements.length; i++) {
        const rel = relElements[i];
        const id = rel.getAttribute('Id');
        const target = rel.getAttribute('Target');
        const type = rel.getAttribute('Type');
        
        if (id && target) {
          rels[id] = { target: target.replace('../', ''), type };
        }
      }
      
      relationships[relFile] = rels;
    } catch (error) {
      console.warn(`Error processing relationships ${relFile}:`, error.message);
    }
  }
  
  return relationships;
}

function getMimeType(extension) {
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[extension.toLowerCase()] || 'image/png';
}

function parseSlideXML(xmlContent, slideNumber, slideRelationships, images) {
  try {
    console.log(`Parsing slide ${slideNumber}...`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    // Multiple approaches to extract text - cast a wide net
    const allTextElements = [];
    const imageRefs = [];
    
    // Method 1: Find all text elements using multiple selectors
    const textSelectors = ['a:t', 'p:t', 'w:t', 't'];
    textSelectors.forEach(selector => {
      const elements = doc.getElementsByTagName(selector);
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element && element.textContent && element.textContent.trim()) {
          allTextElements.push(element.textContent.trim());
        }
      }
    });
    
    // Method 2: If no text found, try broader search
    if (allTextElements.length === 0) {
      console.log(`No text found with standard selectors, trying broader search...`);
      
      // Get all elements and extract text content
      const allElements = doc.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        if (element && element.textContent) {
          const text = element.textContent.trim();
          // Only include meaningful text (not just whitespace or very short text)
          if (text && text.length > 2 && !text.match(/^[\s\n\r\t]*$/)) {
            // Avoid duplicates
            if (!allTextElements.includes(text)) {
              allTextElements.push(text);
            }
          }
        }
      }
    }
    
    // Method 3: Extract from specific PowerPoint structures
    const shapes = doc.getElementsByTagName('p:sp');
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      
      // Try different text body selectors
      const textBodySelectors = ['p:txBody', 'txBody', 'textBody'];
      for (const selector of textBodySelectors) {
        const textBody = shape.getElementsByTagName(selector)[0];
        if (textBody) {
          const paragraphs = textBody.getElementsByTagName('a:p');
          for (let j = 0; j < paragraphs.length; j++) {
            const paragraph = paragraphs[j];
            const textRuns = paragraph.getElementsByTagName('a:t');
            let paragraphText = '';
            
            for (let k = 0; k < textRuns.length; k++) {
              const textNode = textRuns[k];
              if (textNode && textNode.textContent) {
                paragraphText += textNode.textContent;
              }
            }
            
            if (paragraphText.trim() && !allTextElements.includes(paragraphText.trim())) {
              allTextElements.push(paragraphText.trim());
            }
          }
        }
      }
    }
    
    // Process images
    const pics = doc.getElementsByTagName('p:pic');
    for (let i = 0; i < pics.length; i++) {
      const pic = pics[i];
      const blip = pic.getElementsByTagName('a:blip')[0];
      
      if (blip) {
        const embedId = blip.getAttribute('r:embed');
        if (embedId && slideRelationships[embedId]) {
          const imagePath = slideRelationships[embedId].target;
          const imageName = path.basename(imagePath);
          
          if (images[imageName]) {
            imageRefs.push({
              src: images[imageName],
              alt: `Image ${i + 1}`,
              order: i
            });
          }
        }
      }
    }
    
    console.log(`Slide ${slideNumber}: Found ${allTextElements.length} text elements, ${imageRefs.length} images`);
    console.log(`Text elements:`, allTextElements.slice(0, 3)); // Log first 3 for debugging
    
    // Clean and deduplicate text elements
    const uniqueTextElements = [...new Set(allTextElements)]
      .filter(text => text && text.length > 0)
      .sort((a, b) => b.length - a.length); // Sort by length, longest first
    
    // Determine title and content
    let title = `Slide ${slideNumber}`;
    let content = [];
    
    if (uniqueTextElements.length > 0) {
      // First/longest text is usually the title
      title = uniqueTextElements[0];
      content = uniqueTextElements.slice(1);
      
      // If title is very long, it might be content
      if (title.length > 150 && uniqueTextElements.length > 1) {
        title = `Slide ${slideNumber}`;
        content = uniqueTextElements;
      }
    }
    
    // If still no content, create fallback
    if (content.length === 0 && uniqueTextElements.length === 0) {
      content = ['Content extraction in progress...'];
    }
    
    // Determine layout based on content
    let layout = 'title-content';
    if (imageRefs.length > 0 && content.length > 0) {
      layout = 'content-with-image';
    } else if (imageRefs.length > 1) {
      layout = 'image-gallery';
    } else if (imageRefs.length === 1 && content.length === 0) {
      layout = 'image-only';
    } else if (content.length > 3) {
      layout = 'bullet-list';
    }
    
    const result = {
      number: slideNumber,
      title: title,
      content: content,
      images: imageRefs,
      layout: layout,
      hasImages: imageRefs.length > 0
    };
    
    console.log(`Slide ${slideNumber} parsed:`, {
      title: title.substring(0, 50) + '...',
      contentCount: content.length,
      imageCount: imageRefs.length,
      layout: layout
    });
    
    return result;
    
  } catch (error) {
    console.error(`Error parsing slide ${slideNumber} XML:`, error);
    return {
      number: slideNumber,
      title: `Slide ${slideNumber}`,
      content: ['Error extracting content - please check the PowerPoint file'],
      images: [],
      layout: 'title-content'
    };
  }
}

function generatePresentationHTML(slides) {
  const slidesHtml = slides.map(slide => {
    return generateModernSlideHTML(slide);
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PowerPoint Presentation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #f8fafc;
          color: #1e293b;
          line-height: 1.6;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          font-size: 16px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .slide {
          width: 100vw;
          height: 100vh;
          background: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          margin-bottom: 2px;
          overflow: hidden;
        }
        
        /* Modern Slide Layout */
        .modern-slide {
          padding: 40px 50px;
          display: flex;
          flex-direction: column;
          gap: 30px;
          min-height: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        
        /* Slide Title */
        .slide-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(24px, 3.5vw, 36px);
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
          margin-bottom: 15px;
          letter-spacing: -0.025em;
          text-align: center;
          padding-bottom: 15px;
          border-bottom: 3px solid #3b82f6;
        }
        
        /* Content Layout */
        .slide-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
          height: 100%;
          min-height: 0;
        }
        
        .slide-content.single-column {
          grid-template-columns: 1fr;
          max-width: 100%;
          justify-items: center;
        }
        
        .slide-content.image-focus {
          grid-template-columns: 1.2fr 1fr;
        }
        
        /* Text Content */
        .text-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: flex-start;
          height: 100%;
        }
        
        .section-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(18px, 2.2vw, 24px);
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 12px;
          line-height: 1.3;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .content-list {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }
        
        .content-item {
          font-family: 'Inter', sans-serif;
          font-size: clamp(14px, 1.6vw, 18px);
          font-weight: 400;
          color: #374151;
          line-height: 1.6;
          margin-bottom: 10px;
          padding: 12px 16px 12px 32px;
          position: relative;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
          transition: all 0.2s ease;
        }
        
        .content-item:hover {
          background: rgba(239, 246, 255, 0.9);
          transform: translateX(2px);
        }
        
        .content-item::before {
          content: "•";
          color: #3b82f6;
          font-weight: 700;
          font-size: 1.1em;
          position: absolute;
          left: 12px;
          top: 12px;
        }
        
        /* Image Section */
        .image-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
          justify-content: center;
        }
        
        .slide-image {
          max-width: 100%;
          max-height: 500px;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          background: #ffffff;
        }
        
        /* Title Slide */
        .title-slide {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 80px 60px;
        }
        
        .title-slide .slide-title {
          font-size: clamp(36px, 6vw, 72px);
          font-weight: 800;
          margin-bottom: 30px;
          text-shadow: 0 4px 8px rgba(0,0,0,0.3);
          color: white;
        }
        
        .title-slide .slide-subtitle {
          font-size: clamp(18px, 3vw, 28px);
          font-weight: 300;
          opacity: 0.9;
          max-width: 80%;
          line-height: 1.5;
        }
        
        /* Chart/Data Visualization */
        .chart-section {
          background: #f8fafc;
          border-radius: 12px;
          padding: 30px;
          border: 1px solid #e2e8f0;
        }
        
        .chart-title {
          font-family: 'Inter', sans-serif;
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 600;
          color: #64748b;
          margin-bottom: 20px;
          text-align: center;
        }
        
        /* Enhanced Title Slide Styles */
        .title-container {
          position: relative;
          z-index: 2;
          max-width: 90%;
          margin: 0 auto;
        }
        
        .title-decoration {
          width: 100px;
          height: 4px;
          background: linear-gradient(90deg, #60a5fa, #34d399);
          margin: 0 auto 30px;
          border-radius: 2px;
        }
        
        .main-title {
          font-size: clamp(32px, 6vw, 64px);
          font-weight: 800;
          margin-bottom: 30px;
          text-shadow: 0 4px 8px rgba(0,0,0,0.3);
          color: white;
          border: none;
          text-align: center;
        }
        
        .subtitle-section {
          margin-top: 40px;
        }
        
        .subtitle-text {
          font-size: clamp(16px, 2.5vw, 24px);
          font-weight: 300;
          opacity: 0.9;
          margin-bottom: 15px;
          line-height: 1.6;
        }
        
        .title-accent {
          width: 60px;
          height: 2px;
          background: rgba(255, 255, 255, 0.6);
          margin: 30px auto 0;
          border-radius: 1px;
        }
        
        /* Image Slide Styles */
        .image-slide {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 40px;
        }
        
        .slide-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .slide-divider {
          width: 80px;
          height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          margin: 15px auto 0;
          border-radius: 2px;
        }
        
        .image-showcase {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 30px;
        }
        
        .image-container {
          position: relative;
          max-width: 100%;
          text-align: center;
        }
        
        .image-container.single-image {
          max-width: 80%;
        }
        
        .image-container.multi-image {
          max-width: 45%;
          display: inline-block;
          margin: 0 2.5%;
        }
        
        .showcase-image {
          max-width: 100%;
          max-height: 60vh;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          background: white;
          padding: 20px;
        }
        
        .image-caption {
          margin-top: 15px;
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        /* Split Layout Styles */
        .split-slide {
          background: #ffffff;
          padding: 50px;
        }
        
        .split-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 50px;
          align-items: start;
          height: 100%;
        }
        
        .split-content.detailed {
          grid-template-columns: 1fr 1fr;
        }
        
        .content-panel {
          background: #f8fafc;
          border-radius: 16px;
          padding: 40px;
          border: 1px solid #e2e8f0;
          height: fit-content;
        }
        
        .content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        
        .content-block {
          position: relative;
        }
        
        .content-block.bullet::before {
          content: "▶";
          color: #3b82f6;
          font-size: 12px;
          margin-right: 12px;
          font-weight: bold;
        }
        
        .content-block.definition .content-text {
          font-weight: 500;
          color: #1e293b;
        }
        
        .content-block.paragraph .content-text {
          line-height: 1.7;
          color: #374151;
        }
        
        .content-text {
          font-size: clamp(14px, 1.4vw, 18px);
          line-height: 1.6;
          color: #374151;
        }
        
        .media-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: center;
        }
        
        .media-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .media-item {
          position: relative;
        }
        
        .image-frame {
          background: white;
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .panel-image {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: contain;
          border-radius: 8px;
        }
        
        /* Bullet List Styles */
        .list-slide {
          background: #ffffff;
          padding: 50px;
        }
        
        .list-content {
          flex: 1;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 50px;
          align-items: start;
        }
        
        .bullet-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .bullet-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 12px;
          border-left: 4px solid #3b82f6;
          transition: all 0.3s ease;
          opacity: 0;
          animation: slideInUp 0.6s ease forwards;
        }
        
        .bullet-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        .bullet-marker {
          flex-shrink: 0;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
        }
        
        .bullet-dot {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        }
        
        .bullet-text {
          flex: 1;
          font-size: clamp(14px, 1.5vw, 18px);
          line-height: 1.6;
          color: #374151;
          font-weight: 400;
        }
        
        .list-media {
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: flex-start;
        }
        
        .supporting-image {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .support-img {
          width: 100%;
          height: auto;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
        }
        
        /* Text Heavy Layout */
        .text-slide {
          background: #ffffff;
          padding: 50px;
        }
        
        .text-content {
          flex: 1;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
          align-items: start;
        }
        
        .text-columns {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }
        
        .text-paragraph {
          font-size: clamp(14px, 1.4vw, 17px);
          line-height: 1.7;
          color: #374151;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 3px solid #e2e8f0;
        }
        
        .text-paragraph.lead-paragraph {
          font-size: clamp(16px, 1.6vw, 19px);
          font-weight: 500;
          color: #1e293b;
          border-left-color: #3b82f6;
          background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
        }
        
        .text-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: flex-start;
        }
        
        .sidebar-image {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .sidebar-img {
          width: 100%;
          height: auto;
          max-height: 250px;
          object-fit: contain;
          border-radius: 8px;
        }
        
        /* Standard Layout */
        .standard-slide {
          background: #ffffff;
          padding: 50px;
        }
        
        .standard-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: start;
        }
        
        .content-area {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .standard-item {
          font-size: clamp(14px, 1.4vw, 17px);
          line-height: 1.6;
          color: #374151;
          padding: 15px 20px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }
        
        .image-area {
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: center;
        }
        
        .standard-image {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .std-img {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: contain;
          border-radius: 8px;
        }
        
        /* Animations */
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          .split-content,
          .list-content,
          .text-content,
          .standard-content {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          
          .split-slide,
          .list-slide,
          .text-slide,
          .standard-slide {
            padding: 40px;
          }
        }
        
        @media (max-width: 768px) {
          .image-slide,
          .split-slide,
          .list-slide,
          .text-slide,
          .standard-slide {
            padding: 30px;
          }
          
          .content-panel {
            padding: 25px;
          }
          
          .bullet-item {
            padding: 15px;
            gap: 15px;
          }
          
          .showcase-image {
            max-height: 40vh;
            padding: 15px;
          }
          
          .image-container.multi-image {
            max-width: 90%;
            margin: 10px 5%;
            display: block;
          }
        }
        
        @media (max-width: 480px) {
          .title-slide {
            padding: 30px 20px;
          }
          
          .image-slide,
          .split-slide,
          .list-slide,
          .text-slide,
          .standard-slide {
            padding: 20px;
          }
          
          .content-panel {
            padding: 20px;
          }
          
          .bullet-item {
            padding: 12px;
            gap: 12px;
          }
          
          .bullet-marker {
            width: 20px;
            height: 20px;
          }
          
          .showcase-image {
            max-height: 35vh;
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      ${slidesHtml}
    </body>
    </html>
  `;
}

function generateModernSlideHTML(slide) {
  const { number, title, content, images, layout } = slide;
  
  // Analyze content to determine best layout
  const hasImages = images && images.length > 0;
  const hasContent = content && content.length > 0;
  const isLongContent = content && content.some(item => item.length > 100);
  const isBulletList = content && content.some(item => 
    item.trim().startsWith('•') || 
    item.trim().startsWith('-') || 
    item.trim().startsWith('*')
  );
  
  // Smart layout detection
  let slideLayout = 'standard';
  if (number === 1) {
    slideLayout = 'title';
  } else if (hasImages && !hasContent) {
    slideLayout = 'image-only';
  } else if (hasImages && hasContent) {
    slideLayout = content.length > 2 ? 'split-detailed' : 'split-simple';
  } else if (isBulletList || content.length > 3) {
    slideLayout = 'bullet-list';
  } else if (isLongContent) {
    slideLayout = 'text-heavy';
  }
  
  // Title slide with enhanced design
  if (slideLayout === 'title') {
    return `
      <section class="slide title-slide" data-slide="${number}">
        <div class="title-container">
          <div class="title-decoration"></div>
          <h1 class="main-title">${formatText(title)}</h1>
          ${content.length > 0 ? `
            <div class="subtitle-section">
              ${content.slice(0, 2).map(item => `
                <p class="subtitle-text">${formatText(item)}</p>
              `).join('')}
            </div>
          ` : ''}
          <div class="title-accent"></div>
        </div>
      </section>
    `;
  }
  
  // Image-only slide
  if (slideLayout === 'image-only') {
    return `
      <section class="slide image-slide" data-slide="${number}">
        <div class="slide-header">
          <h2 class="slide-title">${formatText(title)}</h2>
        </div>
        <div class="image-showcase">
          ${images.map((img, index) => `
            <div class="image-container ${images.length > 1 ? 'multi-image' : 'single-image'}">
              <img src="${img.src}" alt="${img.alt}" class="showcase-image" />
              ${images.length > 1 ? `<div class="image-caption">Figure ${index + 1}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }
  
  // Split layout (content + images)
  if (slideLayout === 'split-detailed' || slideLayout === 'split-simple') {
    return `
      <section class="slide split-slide" data-slide="${number}">
        <div class="slide-header">
          <h2 class="slide-title">${formatText(title)}</h2>
          <div class="slide-divider"></div>
        </div>
        
        <div class="split-content ${slideLayout === 'split-detailed' ? 'detailed' : 'simple'}">
          <div class="content-panel">
            <div class="content-wrapper">
              ${content.map((item, index) => {
                const itemType = detectContentType(item);
                return `
                  <div class="content-block ${itemType}">
                    <div class="content-text">${formatText(item)}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="media-panel">
            <div class="media-wrapper">
              ${images.map((img, index) => `
                <div class="media-item">
                  <div class="image-frame">
                    <img src="${img.src}" alt="${img.alt}" class="panel-image" />
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Bullet list layout
  if (slideLayout === 'bullet-list') {
    return `
      <section class="slide list-slide" data-slide="${number}">
        <div class="slide-header">
          <h2 class="slide-title">${formatText(title)}</h2>
          <div class="slide-divider"></div>
        </div>
        
        <div class="list-content">
          <div class="bullet-container">
            ${content.map((item, index) => {
              const cleanItem = item.replace(/^[•\-\*]\s*/, '');
              return `
                <div class="bullet-item" style="animation-delay: ${index * 0.1}s">
                  <div class="bullet-marker">
                    <span class="bullet-dot"></span>
                  </div>
                  <div class="bullet-text">${formatText(cleanItem)}</div>
                </div>
              `;
            }).join('')}
          </div>
          
          ${hasImages ? `
            <div class="list-media">
              ${images.slice(0, 2).map(img => `
                <div class="supporting-image">
                  <img src="${img.src}" alt="${img.alt}" class="support-img" />
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }
  
  // Text-heavy layout
  if (slideLayout === 'text-heavy') {
    return `
      <section class="slide text-slide" data-slide="${number}">
        <div class="slide-header">
          <h2 class="slide-title">${formatText(title)}</h2>
          <div class="slide-divider"></div>
        </div>
        
        <div class="text-content">
          <div class="text-columns">
            ${content.map((item, index) => `
              <div class="text-paragraph ${index === 0 ? 'lead-paragraph' : ''}">
                ${formatText(item)}
              </div>
            `).join('')}
          </div>
          
          ${hasImages ? `
            <div class="text-sidebar">
              ${images.slice(0, 1).map(img => `
                <div class="sidebar-image">
                  <img src="${img.src}" alt="${img.alt}" class="sidebar-img" />
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </section>
    `;
  }
  
  // Standard layout (fallback)
  return `
    <section class="slide standard-slide" data-slide="${number}">
      <div class="slide-header">
        <h2 class="slide-title">${formatText(title)}</h2>
        <div class="slide-divider"></div>
      </div>
      
      <div class="standard-content">
        ${hasContent ? `
          <div class="content-area">
            ${content.map(item => `
              <div class="standard-item">${formatText(item)}</div>
            `).join('')}
          </div>
        ` : ''}
        
        ${hasImages ? `
          <div class="image-area">
            ${images.map(img => `
              <div class="standard-image">
                <img src="${img.src}" alt="${img.alt}" class="std-img" />
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

function detectContentType(text) {
  if (!text) return 'standard';
  
  const trimmed = text.trim();
  if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
    return 'bullet';
  }
  if (trimmed.length > 200) {
    return 'paragraph';
  }
  if (trimmed.includes(':') && trimmed.length < 100) {
    return 'definition';
  }
  if (/^\d+\./.test(trimmed)) {
    return 'numbered';
  }
  return 'standard';
}

function formatText(text) {
  if (!text) return '';
  
  let formatted = text.trim();
  
  // Remove bullet points for cleaner display
  formatted = formatted.replace(/^[•\-\*]\s*/, '');
  
  // Handle basic formatting
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Handle line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  // Handle special characters
  formatted = formatted.replace(/&/g, '&');
  formatted = formatted.replace(/</g, '<');
  formatted = formatted.replace(/>/g, '>');
  
  // Re-enable HTML tags we want
  formatted = formatted.replace(/<(\/?)(?:strong|em|br)>/g, '<$1$2>');
  
  return formatted;
}

function generateFallbackHTML(filePath) {
  const fileName = path.basename(filePath);
  const fileUrl = filePath.replace(process.cwd() + '/public', '');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PowerPoint Presentation - ${fileName}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/theme/white.css">
      <style>
        .fallback-slide {
          text-align: center;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .fallback-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .fallback-title {
          font-size: 3rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }
        
        .fallback-subtitle {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        
        .fallback-message {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }
        
        .btn {
          display: inline-block;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          background: #10b981;
          color: white;
        }
        
        .btn-secondary:hover {
          background: #059669;
        }
        
        .instructions {
          text-align: left;
          max-width: 600px;
          margin: 0 auto;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .instructions ul {
          list-style: none;
          padding: 0;
        }
        
        .instructions li {
          margin-bottom: 0.5rem;
          padding-left: 1rem;
          position: relative;
        }
        
        .instructions li:before {
          content: "•";
          color: #93c5fd;
          position: absolute;
          left: 0;
        }
        
        .instructions a {
          color: #93c5fd;
          text-decoration: none;
        }
        
        .instructions a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="reveal">
        <div class="slides">
          <section class="fallback-slide">
            <div class="fallback-content">
              <h1 class="fallback-title">PowerPoint Presentation</h1>
              <h2 class="fallback-subtitle">${fileName}</h2>
              
              <p class="fallback-message">
                Unable to convert this PowerPoint file to HTML5 presentation. 
                This could be due to file format issues or conversion limitations.
              </p>
              
              <div class="button-group">
                <a href="${fileUrl}" download class="btn btn-primary">
                  Download PowerPoint
                </a>
                <a href="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent('http://localhost:3000' + fileUrl)}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="btn btn-secondary">
                  View Online
                </a>
              </div>
              
              <div class="instructions">
                <p><strong>Alternative Viewing Options:</strong></p>
                <ul>
                  <li>Download the file and open in Microsoft PowerPoint</li>
                  <li>Use Microsoft Office Online viewer (click "View Online" above)</li>
                  <li>Upload to Google Slides for web-based viewing</li>
                  <li>Convert to PDF for universal compatibility</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/reveal.js@4.3.1/dist/reveal.js"></script>
      <script>
        Reveal.initialize({
          hash: true,
          transition: 'fade',
          controls: true,
          progress: true,
          center: true,
          touch: true
        });
      </script>
    </body>
    </html>
  `;
}