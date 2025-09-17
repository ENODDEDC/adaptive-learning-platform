import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { DOMParser } from 'xmldom';
import sharp from 'sharp';
import { PowerPointLayoutEngine } from './powerPointLayoutEngine.js';

/**
 * Enhanced PowerPoint processor that preserves layout, formatting, and positioning
 * Uses a multi-layered approach for accurate rendering
 */
export class EnhancedPPTXProcessor {
  constructor() {
    this.slideImages = new Map();
    this.slideLayouts = new Map();
    this.masterSlides = new Map();
    this.relationships = new Map();
    this.themes = new Map();
    this.layoutEngine = new PowerPointLayoutEngine();
  }

  /**
   * Main processing function
   */
  async processPresentation(filePath) {
    try {
      console.log('🚀 Starting enhanced PowerPoint processing...');
      
      // Read and parse PPTX file
      const pptxBuffer = await fs.readFile(filePath);
      const zip = await JSZip.loadAsync(pptxBuffer);
      
      // Extract all components
      await this.extractAllComponents(zip);
      
      // Process slides with enhanced rendering
      const slides = await this.processSlides(zip);
      
      // Generate metadata
      const metadata = await this.extractMetadata(zip);
      
      console.log(`✅ Enhanced processing complete: ${slides.length} slides processed`);
      
      return {
        slides,
        metadata,
        processingMethod: 'enhanced'
      };
      
    } catch (error) {
      console.error('❌ Enhanced processing failed:', error);
      throw error;
    }
  }

  /**
   * Extract all PowerPoint components
   */
  async extractAllComponents(zip) {
    console.log('📦 Extracting PowerPoint components...');
    
    // Extract images
    await this.extractImages(zip);
    
    // Extract relationships
    await this.extractRelationships(zip);
    
    // Extract themes and layouts
    await this.extractThemes(zip);
    await this.extractLayouts(zip);
    
    console.log('✅ Component extraction complete');
  }

  /**
   * Extract and process images with proper mapping
   */
  async extractImages(zip) {
    const imageFiles = Object.keys(zip.files).filter(file => 
      file.startsWith('ppt/media/') && 
      /\.(png|jpg|jpeg|gif|bmp|svg|emf|wmf)$/i.test(file)
    );

    console.log(`🖼️ Found ${imageFiles.length} images`);

    for (const imageFile of imageFiles) {
      try {
        const imageBuffer = await zip.file(imageFile).async('nodebuffer');
        const fileName = path.basename(imageFile);
        const fileExtension = path.extname(fileName).toLowerCase();
        
        // Convert to web-compatible format if needed
        let processedBuffer = imageBuffer;
        let mimeType = this.getMimeType(fileExtension);
        
        // Convert EMF/WMF to PNG for web compatibility
        if (['.emf', '.wmf'].includes(fileExtension)) {
          try {
            processedBuffer = await sharp(imageBuffer).png().toBuffer();
            mimeType = 'image/png';
          } catch (conversionError) {
            console.warn(`⚠️ Could not convert ${fileName} to PNG:`, conversionError.message);
          }
        }
        
        const base64 = processedBuffer.toString('base64');
        
        this.slideImages.set(fileName, {
          data: `data:${mimeType};base64,${base64}`,
          buffer: processedBuffer,
          originalBuffer: imageBuffer,
          size: processedBuffer.length,
          type: mimeType,
          fileName: fileName,
          filePath: imageFile
        });
        
        console.log(`✓ Processed image: ${fileName} (${processedBuffer.length} bytes)`);
      } catch (error) {
        console.warn(`✗ Error processing image ${imageFile}:`, error.message);
      }
    }
  }

  /**
   * Extract relationship mappings
   */
  async extractRelationships(zip) {
    const relFiles = Object.keys(zip.files).filter(file => 
      file.includes('_rels/') && file.endsWith('.xml.rels')
    );

    console.log(`🔗 Processing ${relFiles.length} relationship files`);

    for (const relFile of relFiles) {
      try {
        const relXml = await zip.file(relFile).async('string');
        const parser = new DOMParser();
        const doc = parser.parseFromString(relXml, 'text/xml');
        
        const relationships = {};
        const relElements = doc.getElementsByTagName('Relationship');
        
        for (let i = 0; i < relElements.length; i++) {
          const rel = relElements[i];
          const id = rel.getAttribute('Id');
          const target = rel.getAttribute('Target');
          const type = rel.getAttribute('Type');
          
          relationships[id] = { target, type };
        }
        
        this.relationships.set(relFile, relationships);
        
      } catch (error) {
        console.warn(`✗ Error processing relationships ${relFile}:`, error.message);
      }
    }
  }

  /**
   * Extract themes for consistent styling
   */
  async extractThemes(zip) {
    const themeFiles = Object.keys(zip.files).filter(file => 
      file.startsWith('ppt/theme/') && file.endsWith('.xml')
    );

    for (const themeFile of themeFiles) {
      try {
        const themeXml = await zip.file(themeFile).async('string');
        const themeData = this.parseTheme(themeXml);
        this.themes.set(themeFile, themeData);
      } catch (error) {
        console.warn(`✗ Error processing theme ${themeFile}:`, error.message);
      }
    }
  }

  /**
   * Extract slide layouts
   */
  async extractLayouts(zip) {
    const layoutFiles = Object.keys(zip.files).filter(file => 
      file.startsWith('ppt/slideLayouts/') && file.endsWith('.xml')
    );

    for (const layoutFile of layoutFiles) {
      try {
        const layoutXml = await zip.file(layoutFile).async('string');
        const layoutData = this.parseLayout(layoutXml);
        this.slideLayouts.set(layoutFile, layoutData);
      } catch (error) {
        console.warn(`✗ Error processing layout ${layoutFile}:`, error.message);
      }
    }
  }

  /**
   * Process all slides with enhanced rendering
   */
  async processSlides(zip) {
    const slideFiles = Object.keys(zip.files)
      .filter(file => file.startsWith('ppt/slides/slide') && file.endsWith('.xml'))
      .sort((a, b) => {
        const aNum = parseInt(a.match(/slide(\d+)/)[1]);
        const bNum = parseInt(b.match(/slide(\d+)/)[1]);
        return aNum - bNum;
      });

    console.log(`📊 Processing ${slideFiles.length} slides with enhanced rendering...`);

    const slides = [];
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      const slideNumber = i + 1;
      
      try {
        console.log(`🎨 Processing slide ${slideNumber}...`);
        
        const slideXml = await zip.file(slideFile).async('string');
        const slideData = await this.parseSlideWithEnhancedLayout(slideXml, slideNumber);
        const slideHtml = await this.generateEnhancedSlideHTML(slideData, slideNumber);
        
        slides.push({
          number: slideNumber,
          html: slideHtml,
          data: slideData,
          enhanced: true
        });
        
        console.log(`✅ Slide ${slideNumber} processed successfully`);
        
      } catch (error) {
        console.error(`❌ Error processing slide ${slideNumber}:`, error);
        
        // Create fallback slide
        slides.push({
          number: slideNumber,
          html: this.generateFallbackSlideHTML(slideNumber, error.message),
          data: null,
          enhanced: false,
          error: error.message
        });
      }
    }

    return slides;
  }

  /**
   * Parse slide with enhanced layout preservation
   */
  async parseSlideWithEnhancedLayout(slideXml, slideNumber) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(slideXml, 'text/xml');
    
    // Extract all text elements with positioning
    const textElements = this.extractTextElementsWithPositioning(doc);
    
    // Extract image elements with positioning
    const imageElements = this.extractImageElementsWithPositioning(doc, slideNumber);
    
    // Extract shape elements
    const shapeElements = this.extractShapeElements(doc);
    
    // Determine slide layout type
    const layoutType = this.determineSlideLayoutType(textElements, imageElements, shapeElements);
    
    // Extract background information
    const background = this.extractSlideBackground(doc);
    
    return {
      slideNumber,
      textElements,
      imageElements,
      shapeElements,
      layoutType,
      background,
      dimensions: { width: 1280, height: 720 } // Standard 16:9 aspect ratio
    };
  }

  /**
   * Extract text elements with accurate positioning
   */
  extractTextElementsWithPositioning(doc) {
    const textElements = [];
    const textShapes = doc.getElementsByTagName('p:sp');
    
    for (let i = 0; i < textShapes.length; i++) {
      const shape = textShapes[i];
      
      // Check if this shape contains text
      const textBody = shape.getElementsByTagName('p:txBody')[0];
      if (!textBody) continue;
      
      // Extract positioning
      const spPr = shape.getElementsByTagName('p:spPr')[0];
      const position = this.extractPosition(spPr);
      const size = this.extractSize(spPr);
      
      // Extract text content and formatting
      const paragraphs = textBody.getElementsByTagName('a:p');
      const textContent = this.extractFormattedText(paragraphs);
      
      if (textContent.trim()) {
        textElements.push({
          text: textContent,
          position,
          size,
          formatting: this.extractTextFormatting(paragraphs),
          type: this.classifyTextElement(textContent, position, i)
        });
      }
    }
    
    return textElements;
  }

  /**
   * Extract image elements with positioning
   */
  extractImageElementsWithPositioning(doc, slideNumber) {
    const imageElements = [];
    const pics = doc.getElementsByTagName('p:pic');
    
    for (let i = 0; i < pics.length; i++) {
      const pic = pics[i];
      
      // Extract image reference
      const blip = pic.getElementsByTagName('a:blip')[0];
      if (!blip) continue;
      
      const embedId = blip.getAttribute('r:embed');
      if (!embedId) continue;
      
      // Get image from relationships
      const slideRelFile = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
      const relationships = this.relationships.get(slideRelFile);
      
      if (relationships && relationships[embedId]) {
        const imagePath = relationships[embedId].target.replace('../', '');
        const imageName = path.basename(imagePath);
        const imageData = this.slideImages.get(imageName);
        
        if (imageData) {
          // Extract positioning
          const spPr = pic.getElementsByTagName('p:spPr')[0];
          const position = this.extractPosition(spPr);
          const size = this.extractSize(spPr);
          
          imageElements.push({
            src: imageData.data,
            position,
            size,
            alt: `Image ${i + 1}`,
            embedId
          });
        }
      }
    }
    
    return imageElements;
  }

  /**
   * Generate enhanced slide HTML using the new layout engine
   */
  async generateEnhancedSlideHTML(slideData, slideNumber) {
    const { textElements, imageElements, background } = slideData;
    
    // Use the enhanced layout engine for professional rendering
    const enhancedHtml = this.layoutEngine.generateEnhancedSlideHTML({
      ...slideData,
      slideNumber
    });
    
    // Add the PowerPoint CSS framework
    const cssLink = '<link rel="stylesheet" href="/styles/powerpoint-layout.css">';
    
    // Generate theme CSS if available
    const themeCSS = this.layoutEngine.generateThemeCSS(this.extractThemeColors(background));
    
    // Return complete HTML with styles
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Slide ${slideNumber}</title>
        ${cssLink}
        ${themeCSS}
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', 'Calibri', system-ui, sans-serif;
            background: #f8f9fb;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .slide-wrapper {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            height: 100vh;
            max-height: 800px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .ppt-presentation-container {
            width: 100%;
            height: 100%;
            max-height: 100%;
            overflow: hidden;
          }
          
          .ppt-slide {
            height: 100%;
            max-height: 100%;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="slide-wrapper">
          ${enhancedHtml}
        </div>
      </body>
      </html>
    `;
  }
  
  /**
   * Extract theme colors from slide background
   */
  extractThemeColors(background) {
    // Default PowerPoint theme
    const defaultTheme = {
      primaryColor: '#1f4e79',
      secondaryColor: '#4472c4',
      accentColor: '#70ad47',
      backgroundColor: '#ffffff',
      textColor: '#1f2328'
    };
    
    if (!background) return defaultTheme;
    
    // Extract colors from background if available
    // This could be enhanced to parse actual PowerPoint theme colors
    return defaultTheme;
  }
  
  /**
   * Legacy method for backward compatibility
   */
  async generateLegacySlideHTML(slideData, slideNumber) {
    const { textElements, imageElements, background } = slideData;
    
    // Extract all text content
    const allTexts = textElements.map(el => el.text).filter(text => text && text.trim());
    
    // Determine title and content
    let title = '';
    let content = [];
    
    if (allTexts.length > 0) {
      // First text is usually the title
      title = allTexts[0] || '';
      // Rest is content
      content = allTexts.slice(1);
      
      // If no content, use all text as content and create a generic title
      if (content.length === 0 && allTexts.length === 1) {
        content = [allTexts[0]];
        title = `Slide ${slideNumber}`;
      }
    } else {
      title = `Slide ${slideNumber}`;
      content = ['No content available'];
    }
    
    // Generate content HTML
    const contentHtml = content.length > 0 
      ? content.map(text => `<div class="content-block">${text}</div>`).join('')
      : '<div class="content-block">No content available</div>';
    
    // Generate images HTML - positioned to not overlap text
    const imagesHtml = imageElements.length > 0 
      ? `
        <div class="images-section">
          ${imageElements.map((img, index) => `
            <div class="image-wrapper">
              <img src="${img.src}" alt="Image ${index + 1}" />
            </div>
          `).join('')}
        </div>
      `
      : '';
    
    // Return legacy slide content for backward compatibility
    return `
      <div class="enhanced-slide-content" style="
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        flex-direction: column;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        position: relative;
        overflow: hidden;
      ">
        <style>
          .enhanced-slide-content {
            box-sizing: border-box;
          }
          
          .slide-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: clamp(15px, 3vw, 30px);
            text-align: center;
            flex-shrink: 0;
          }
          
          .slide-title {
            font-size: clamp(18px, 4vw, 32px);
            font-weight: bold;
            line-height: 1.2;
            margin: 0;
            word-wrap: break-word;
          }
          
          .slide-main {
            flex: 1;
            display: flex;
            min-height: 0;
            ${imageElements.length > 0 ? '' : 'align-items: center;'}
          }
          
          .content-section {
            flex: ${imageElements.length > 0 ? '3' : '1'};
            padding: clamp(15px, 3vw, 30px);
            display: flex;
            flex-direction: column;
            justify-content: ${imageElements.length > 0 ? 'flex-start' : 'center'};
            overflow-y: auto;
          }
          
          .content-block {
            font-size: clamp(14px, 2.5vw, 18px);
            line-height: 1.5;
            color: #333;
            margin-bottom: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .images-section {
            flex: 2;
            background: #f8f9fa;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            justify-content: center;
            align-items: center;
            overflow-y: auto;
          }
          
          .image-wrapper {
            width: 100%;
            max-width: 250px;
            background: white;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .image-wrapper img {
            width: 100%;
            height: auto;
            max-height: 150px;
            object-fit: contain;
            border-radius: 4px;
            display: block;
          }
          
          /* Responsive design */
          @media (max-width: 768px) {
            .slide-main {
              flex-direction: column;
            }
            
            .content-section {
              flex: 1;
              padding: 15px;
            }
            
            .images-section {
              flex: none;
              max-height: 200px;
              flex-direction: row;
              overflow-x: auto;
              overflow-y: hidden;
              padding: 10px;
            }
            
            .image-wrapper {
              flex-shrink: 0;
              width: 150px;
              max-width: none;
            }
            
            .image-wrapper img {
              max-height: 100px;
            }
            
            .content-block {
              font-size: 14px;
              padding: 12px;
              margin-bottom: 12px;
            }
          }
          
          @media (max-width: 480px) {
            .slide-header {
              padding: 12px;
            }
            
            .slide-title {
              font-size: 16px;
            }
            
            .content-section {
              padding: 12px;
            }
            
            .content-block {
              font-size: 12px;
              padding: 10px;
              margin-bottom: 10px;
            }
            
            .images-section {
              padding: 8px;
            }
            
            .image-wrapper {
              width: 120px;
            }
            
            .image-wrapper img {
              max-height: 80px;
            }
          }
        </style>
        
        <div class="slide-header">
          <h1 class="slide-title">${title}</h1>
        </div>
        
        <div class="slide-main">
          <div class="content-section">
            ${contentHtml}
          </div>
          
          ${imagesHtml}
        </div>
      </div>
    `;
  }

  /**
   * Generate CSS for slide elements
   */
  generateSlideCSS(slideData) {
    const { dimensions } = slideData;
    
    return `
      .enhanced-slide {
        aspect-ratio: ${dimensions.width}/${dimensions.height};
      }
    `;
  }

  /**
   * Generate HTML for text elements
   */
  generateTextElementHTML(element, index) {
    const { text, position, size, formatting, type } = element;
    
    const style = `
      left: ${this.convertToPercentage(position.x, 1280)}%;
      top: ${this.convertToPercentage(position.y, 720)}%;
      width: ${this.convertToPercentage(size.width, 1280)}%;
      height: ${this.convertToPercentage(size.height, 720)}%;
      font-size: ${this.calculateResponsiveFontSize(formatting.fontSize)}px;
      font-weight: ${formatting.bold ? 'bold' : 'normal'};
      font-style: ${formatting.italic ? 'italic' : 'normal'};
      color: ${formatting.color || '#000000'};
      text-align: ${formatting.alignment || 'center'};
    `;
    
    const className = `slide-element text-element text-${type}`;
    
    return `<div class="${className}" style="${style}">${text}</div>`;
  }

  /**
   * Generate HTML for image elements
   */
  generateImageElementHTML(element, index) {
    const { src, position, size, alt } = element;
    
    const style = `
      left: ${this.convertToPercentage(position.x, 1280)}%;
      top: ${this.convertToPercentage(position.y, 720)}%;
      width: ${this.convertToPercentage(size.width, 1280)}%;
      height: ${this.convertToPercentage(size.height, 720)}%;
    `;
    
    return `<img class="slide-element image-element" src="${src}" alt="${alt}" style="${style}" />`;
  }

  /**
   * Helper functions
   */
  convertToPercentage(value, total) {
    return Math.max(0, Math.min(100, (value / total) * 100));
  }

  calculateResponsiveFontSize(originalSize) {
    // Convert PowerPoint font size to responsive CSS size
    const baseSize = originalSize || 18;
    return Math.max(12, Math.min(72, baseSize * 1.2));
  }

  extractPosition(spPr) {
    if (!spPr) return { x: 0, y: 0 };
    
    const xfrm = spPr.getElementsByTagName('a:xfrm')[0];
    if (!xfrm) return { x: 0, y: 0 };
    
    const off = xfrm.getElementsByTagName('a:off')[0];
    if (!off) return { x: 0, y: 0 };
    
    return {
      x: parseInt(off.getAttribute('x')) / 9525 || 0, // Convert EMU to pixels
      y: parseInt(off.getAttribute('y')) / 9525 || 0
    };
  }

  extractSize(spPr) {
    if (!spPr) return { width: 100, height: 50 };
    
    const xfrm = spPr.getElementsByTagName('a:xfrm')[0];
    if (!xfrm) return { width: 100, height: 50 };
    
    const ext = xfrm.getElementsByTagName('a:ext')[0];
    if (!ext) return { width: 100, height: 50 };
    
    return {
      width: parseInt(ext.getAttribute('cx')) / 9525 || 100,
      height: parseInt(ext.getAttribute('cy')) / 9525 || 50
    };
  }

  extractFormattedText(paragraphs) {
    let text = '';
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const runs = paragraph.getElementsByTagName('a:r');
      
      for (let j = 0; j < runs.length; j++) {
        const run = runs[j];
        const textNode = run.getElementsByTagName('a:t')[0];
        if (textNode && textNode.textContent) {
          text += textNode.textContent;
        }
      }
      
      if (i < paragraphs.length - 1) {
        text += '\n';
      }
    }
    
    return text;
  }

  extractTextFormatting(paragraphs) {
    const formatting = {
      fontSize: 18,
      bold: false,
      italic: false,
      color: '#000000',
      alignment: 'center'
    };
    
    // Extract formatting from first paragraph/run
    if (paragraphs.length > 0) {
      const paragraph = paragraphs[0];
      const pPr = paragraph.getElementsByTagName('a:pPr')[0];
      
      if (pPr) {
        const algn = pPr.getAttribute('algn');
        if (algn) {
          formatting.alignment = algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : 'left';
        }
      }
      
      const runs = paragraph.getElementsByTagName('a:r');
      if (runs.length > 0) {
        const rPr = runs[0].getElementsByTagName('a:rPr')[0];
        if (rPr) {
          const sz = rPr.getAttribute('sz');
          if (sz) {
            formatting.fontSize = parseInt(sz) / 100; // Convert from hundredths of a point
          }
          
          formatting.bold = rPr.getAttribute('b') === '1';
          formatting.italic = rPr.getAttribute('i') === '1';
          
          // Extract color if present
          const solidFill = rPr.getElementsByTagName('a:solidFill')[0];
          if (solidFill) {
            const srgbClr = solidFill.getElementsByTagName('a:srgbClr')[0];
            if (srgbClr) {
              formatting.color = '#' + srgbClr.getAttribute('val');
            }
          }
        }
      }
    }
    
    return formatting;
  }

  classifyTextElement(text, position, index) {
    const cleanText = text.trim();
    const length = cleanText.length;
    const words = cleanText.split(/\s+/).length;
    const lines = cleanText.split('\n').filter(line => line.trim());
    
    // Title detection - first element, short, no periods, usually centered/top
    if (index === 0) {
      if (length < 100 && words <= 10 && !cleanText.includes('.') && position.y < 150) {
        return 'title';
      } else if (length < 150 && position.y < 200) {
        return 'header';
      }
    }
    
    // Subtitle detection - second element, moderate length, positioned after title
    if (index === 1 && length < 150 && words <= 15 && position.y > 100 && position.y < 300) {
      return 'subtitle';
    }
    
    // Header detection - short text without periods, positioned as heading
    if (length < 80 && words <= 8 && !cleanText.includes('.') && position.y < 250) {
      return 'heading';
    }
    
    // List detection based on content patterns
    if (lines.length > 1) {
      const bulletPattern = /^[•\-\*▶▸]\s/;
      const numberPattern = /^\d+\./;
      const dashPattern = /^[–—]\s/;
      
      const hasBullets = lines.some(line => bulletPattern.test(line.trim()));
      const hasNumbers = lines.some(line => numberPattern.test(line.trim()));
      const hasDashes = lines.some(line => dashPattern.test(line.trim()));
      
      if (hasBullets || hasDashes) {
        return 'bullet-list';
      }
      if (hasNumbers) {
        return 'numbered-list';
      }
    }
    
    // Content blocks - longer text positioned in main content areas
    if (length > 50 && position.y > 200) {
      return 'content';
    }
    
    // Default classification
    return 'paragraph';
  }

  determineSlideLayoutType(textElements, imageElements, shapeElements) {
    if (imageElements.length > textElements.length) {
      return 'image-heavy';
    } else if (textElements.length > 3) {
      return 'text-heavy';
    } else {
      return 'balanced';
    }
  }

  extractSlideBackground(doc) {
    // Extract background information
    const bg = doc.getElementsByTagName('p:bg')[0];
    if (bg) {
      // Parse background properties
      return {
        type: 'solid',
        color: '#ffffff'
      };
    }
    
    return {
      type: 'solid',
      color: '#ffffff'
    };
  }

  generateBackgroundStyle(background) {
    if (background.type === 'solid') {
      return `background-color: ${background.color};`;
    }
    return 'background-color: #ffffff;';
  }

  extractShapeElements(doc) {
    // Extract other shape elements (rectangles, circles, etc.)
    return [];
  }

  parseTheme(themeXml) {
    // Parse theme information for consistent styling
    return {};
  }

  parseLayout(layoutXml) {
    // Parse layout information
    return {};
  }

  async extractMetadata(zip) {
    try {
      const corePropsFile = zip.file('docProps/core.xml');
      if (corePropsFile) {
        const corePropsXml = await corePropsFile.async('string');
        // Parse metadata
        return {
          title: 'PowerPoint Presentation',
          author: 'Unknown',
          created: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Could not extract metadata:', error.message);
    }
    
    return {
      title: 'PowerPoint Presentation',
      author: 'Unknown',
      created: new Date().toISOString()
    };
  }

  generateFallbackSlideHTML(slideNumber, errorMessage) {
    return `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        text-align: center;
        padding: 40px;
      ">
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">Slide ${slideNumber}</h1>
        <p style="font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem;">
          Unable to render this slide with enhanced formatting
        </p>
        <p style="font-size: 0.9rem; opacity: 0.6;">
          Error: ${errorMessage}
        </p>
      </div>
    `;
  }

  getMimeType(extension) {
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.emf': 'image/emf',
      '.wmf': 'image/wmf'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}