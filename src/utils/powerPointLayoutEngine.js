/**
 * Enhanced PowerPoint Layout Engine
 * Provides authentic PowerPoint layouts with intelligent content organization
 */

import { SmartContentOrganizer } from './smartContentOrganizer.js';
import { IntelligentContentPlacer } from './intelligentContentPlacer.js';

export class PowerPointLayoutEngine {
  constructor() {
    this.contentOrganizer = new SmartContentOrganizer();
    this.intelligentPlacer = new IntelligentContentPlacer();
    
    this.layoutPatterns = {
      title: {
        indicators: ['title', 'presentation', 'overview'],
        cssClass: 'ppt-layout-title',
        structure: {
          title: { area: 'title', hierarchy: 1 },
          subtitle: { area: 'subtitle', hierarchy: 2 }
        }
      },
      titleContent: {
        indicators: ['content', 'main', 'body'],
        cssClass: 'ppt-layout-title-content',
        structure: {
          header: { area: 'header', hierarchy: 1 },
          content: { area: 'main', hierarchy: 3 }
        }
      },
      twoContent: {
        indicators: ['comparison', 'versus', 'split'],
        cssClass: 'ppt-layout-two-content',
        structure: {
          header: { area: 'header', hierarchy: 1 },
          leftContent: { area: 'left', hierarchy: 3 },
          rightContent: { area: 'right', hierarchy: 3 }
        }
      },
      contentImage: {
        indicators: ['image', 'picture', 'diagram'],
        cssClass: 'ppt-layout-content-image',
        structure: {
          header: { area: 'header', hierarchy: 1 },
          content: { area: 'content', hierarchy: 3 },
          images: { area: 'image', hierarchy: 4 }
        }
      },
      blank: {
        indicators: ['blank', 'custom'],
        cssClass: 'ppt-layout-blank',
        structure: {
          content: { area: 'content', hierarchy: 3 }
        }
      }
    };
  }

  /**
   * Analyze slide content and determine optimal layout
   */
  analyzeSlideLayout(slideData) {
    const { textElements, imageElements, slideNumber } = slideData;
    
    // Slide 1 is usually a title slide
    if (slideNumber === 1) {
      return this.layoutPatterns.title;
    }
    
    // Analyze content distribution
    const hasImages = imageElements && imageElements.length > 0;
    const textCount = textElements ? textElements.length : 0;
    
    // Determine layout based on content
    if (hasImages && textCount > 0) {
      return this.layoutPatterns.contentImage;
    } else if (textCount >= 3) {
      return this.layoutPatterns.twoContent;
    } else if (textCount > 0) {
      return this.layoutPatterns.titleContent;
    } else {
      return this.layoutPatterns.blank;
    }
  }

  /**
   * Apply intelligent typography based on content hierarchy
   */
  classifyTextHierarchy(text, position, index, totalElements) {
    const cleanText = text.trim();
    const length = cleanText.length;
    const words = cleanText.split(/\s+/).length;
    const lines = cleanText.split('\n').filter(line => line.trim());
    
    // Advanced title detection
    if (index === 0 && totalElements > 1) {
      if (length < 100 && words <= 10 && !cleanText.includes('.')) {
        return { 
          type: 'title', 
          cssClass: 'ppt-title',
          fontSize: this.calculateResponsiveFontSize('title', length),
          weight: 700
        };
      } else if (length < 150) {
        return { 
          type: 'header', 
          cssClass: 'ppt-header',
          fontSize: this.calculateResponsiveFontSize('header', length),
          weight: 600
        };
      }
    }
    
    // Subtitle detection with better heuristics
    if (index === 1 && length < 150 && words <= 15 && totalElements > 2) {
      return { 
        type: 'subtitle', 
        cssClass: 'ppt-subtitle',
        fontSize: this.calculateResponsiveFontSize('subtitle', length),
        weight: 400
      };
    }
    
    // Multi-line content detection
    if (lines.length > 1) {
      const bulletPattern = /^[•\-\*▶▸]\s/;
      const numberPattern = /^\d+\./;
      const hasBullets = lines.some(line => bulletPattern.test(line.trim()));
      const hasNumbers = lines.some(line => numberPattern.test(line.trim()));
      
      if (hasBullets) {
        return { 
          type: 'bullet-list', 
          cssClass: 'ppt-bullet-list',
          fontSize: this.calculateResponsiveFontSize('body', length),
          weight: 400
        };
      }
      if (hasNumbers) {
        return { 
          type: 'numbered-list', 
          cssClass: 'ppt-numbered-list',
          fontSize: this.calculateResponsiveFontSize('body', length),
          weight: 400
        };
      }
    }
    
    // Heading detection based on length and position
    if (length < 80 && words <= 8 && !cleanText.includes('.') && index < 3) {
      const headingLevel = Math.min(index + 1, 3);
      return { 
        type: 'heading', 
        cssClass: `ppt-heading-${headingLevel}`,
        fontSize: this.calculateResponsiveFontSize(`heading-${headingLevel}`, length),
        weight: 600 - (headingLevel * 50)
      };
    }
    
    // Body content with emphasis detection
    if (this.hasEmphasisMarkers(cleanText)) {
      return { 
        type: 'content-emphasis', 
        cssClass: 'ppt-paragraph ppt-emphasis',
        fontSize: this.calculateResponsiveFontSize('body', length),
        weight: 500
      };
    }
    
    // Default body content
    return { 
      type: 'content', 
      cssClass: 'ppt-paragraph',
      fontSize: this.calculateResponsiveFontSize('body', length),
      weight: 400
    };
  }
  
  /**
   * Calculate responsive font sizes based on content type and length
   */
  calculateResponsiveFontSize(type, textLength = 0) {
    const baseSizes = {
      'title': { min: '2rem', ideal: '4vw', max: '2.75rem' },
      'header': { min: '1.5rem', ideal: '3.5vw', max: '2.25rem' },
      'subtitle': { min: '1.125rem', ideal: '2.2vw', max: '1.5rem' },
      'heading-1': { min: '1.25rem', ideal: '2.8vw', max: '1.875rem' },
      'heading-2': { min: '1.125rem', ideal: '2.2vw', max: '1.5rem' },
      'heading-3': { min: '1rem', ideal: '1.8vw', max: '1.25rem' },
      'body': { min: '0.875rem', ideal: '1.5vw', max: '1.125rem' },
      'caption': { min: '0.75rem', ideal: '1.2vw', max: '1rem' }
    };
    
    const size = baseSizes[type] || baseSizes['body'];
    
    // Adjust for text length - longer text gets smaller
    if (textLength > 300) {
      return `clamp(calc(${size.min} * 0.8), calc(${size.ideal} * 0.8), calc(${size.max} * 0.8))`;
    } else if (textLength > 150) {
      return `clamp(calc(${size.min} * 0.9), calc(${size.ideal} * 0.9), calc(${size.max} * 0.9))`;
    }
    
    return `clamp(${size.min}, ${size.ideal}, ${size.max})`;
  }
  
  /**
   * Check if text contains emphasis markers
   */
  hasEmphasisMarkers(text) {
    // Check for various emphasis markers
    return text.includes('**') ||           // Bold markdown
           text.includes('__') ||           // Bold/italic markdown
           text.includes('[IMPORTANT]') ||  // Important markers
           text.includes('IMPORTANT:') ||   // Important prefix
           text.includes('[NOTE]') ||       // Note markers
           text.includes('NOTE:') ||        // Note prefix
           text.includes('*') ||            // Italic markdown
           text.includes('`') ||            // Code markers
           /\b(important|critical|key|main|primary|note|remember|tip|warning)\b/i.test(text); // Important keywords
  }

  /**
   * Process list with enhanced typography
   */
  processList(text, hierarchy = null) {
    const lines = text.split('\n').filter(line => line.trim());
    const isNumberedList = lines.some(line => /^\d+\./.test(line.trim()));
    const isBulletList = lines.some(line => /^[•\-\*▶▸]\s/.test(line.trim()));
    
    if (isNumberedList) {
      return this.createNumberedList(lines, hierarchy);
    } else if (isBulletList || lines.length > 1) {
      return this.createBulletList(lines, hierarchy);
    }
    
    return this.createParagraph(text, hierarchy);
  }

  createBulletList(lines, hierarchy = null) {
    const items = lines.map(line => {
      const trimmed = line.trim().replace(/^[•\-\*▶▸]\s*/, '');
      const priorityClass = this.determineBulletPriority(trimmed);
      
      return `<li class="ppt-bullet-item${priorityClass}" style="font-size: ${hierarchy?.fontSize || 'var(--ppt-text-base)'}">${this.processInlineFormatting(trimmed)}</li>`;
    }).join('');
    
    return `<ul class="ppt-bullet-list">${items}</ul>`;
  }

  createNumberedList(lines, hierarchy = null) {
    const items = lines.map(line => {
      const trimmed = line.replace(/^\d+\.\s*/, '');
      const priorityClass = this.determineBulletPriority(trimmed);
      return `<li class="ppt-numbered-item${priorityClass}" style="font-size: ${hierarchy?.fontSize || 'var(--ppt-text-base)'}">${this.processInlineFormatting(trimmed)}</li>`;
    }).join('');
    
    return `<ol class="ppt-numbered-list">${items}</ol>`;
  }

  createParagraph(text, hierarchy = null) {
    const priorityClass = this.determineParagraphPriority(text);
    const visualClass = this.determineVisualTreatment(text);
    
    if (hierarchy && hierarchy.type === 'content-emphasis') {
      return `<div class="${hierarchy.cssClass}${priorityClass}${visualClass}" style="font-size: ${hierarchy.fontSize}; font-weight: ${hierarchy.weight}">${this.processInlineFormatting(text)}</div>`;
    }
    
    return `<p class="ppt-paragraph${priorityClass}${visualClass}" style="font-size: ${hierarchy?.fontSize || 'var(--ppt-text-base)'}; font-weight: ${hierarchy?.weight || 400}">${this.processInlineFormatting(text)}</p>`;
  }

  /**
   * Process inline formatting with enhanced visual hierarchy
   */
  processInlineFormatting(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<span class="ppt-emphasis">$1</span>')
      .replace(/__(.*?)__/g, '<span class="ppt-highlight">$1</span>')
      .replace(/\*(.*?)\*/g, '<em class="ppt-italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="ppt-code">$1</code>');
  }

  /**
   * Determine bullet point priority based on content
   */
  determineBulletPriority(text) {
    const importantKeywords = ['important', 'critical', 'key', 'main', 'primary'];
    const noteKeywords = ['note', 'remember', 'tip', 'warning'];
    
    const lowerText = text.toLowerCase();
    
    if (importantKeywords.some(keyword => lowerText.includes(keyword))) {
      return ' ppt-priority-high';
    }
    if (noteKeywords.some(keyword => lowerText.includes(keyword))) {
      return ' ppt-priority-medium';
    }
    
    return '';
  }

  /**
   * Determine paragraph priority for visual hierarchy
   */
  determineParagraphPriority(text) {
    if (text.length < 50) return ' ppt-content-primary';
    if (text.length < 150) return ' ppt-content-secondary';
    return ' ppt-content-tertiary';
  }

  /**
   * Determine visual treatment based on content markers
   */
  determineVisualTreatment(text) {
    if (text.includes('[IMPORTANT]') || text.includes('IMPORTANT:')) {
      return ' ppt-visual-important';
    }
    if (text.includes('[NOTE]') || text.includes('NOTE:')) {
      return ' ppt-visual-note';
    }
    if (text.includes('**') || text.includes('__')) {
      return ' ppt-visual-emphasis';
    }
    
    return '';
  }

  /**
   * Generate enhanced slide HTML with intelligent content organization
   */
  generateEnhancedSlideHTML(slideData) {
    try {
      console.log('🧠 Generating slide with intelligent content placement...');
      
      // Apply smart content organization fallback
      const organizedSlideData = this.contentOrganizer ? 
        this.contentOrganizer.applyIntelligentPositioning(slideData) : 
        slideData;
      
      const layout = this.analyzeSlideLayout(organizedSlideData);
      const { textElements = [], imageElements = [], slideNumber } = organizedSlideData;
      
      // Process text elements with enhanced hierarchy and positioning
      const processedTexts = textElements.map((element, index) => {
        const hierarchy = this.classifyTextHierarchy(
          element.text || '', 
          element.position || {}, 
          index, 
          textElements.length
        );
        
        let processedText;
        if (hierarchy.type === 'bullet-list' || hierarchy.type === 'numbered-list') {
          processedText = this.processList(element.text, hierarchy);
        } else {
          processedText = this.processList(element.text, hierarchy);
        }
        
        return {
          ...element,
          ...hierarchy,
          processedText,
          smartPosition: element.optimalPosition || element.position || {},
          cssStyle: element.cssStyle || {},
          gridArea: element.gridArea || 'content'
        };
      });
      
      // Process images with intelligent positioning
      const processedImages = imageElements.map((element, index) => ({
        ...element,
        smartPosition: element.optimalPosition || element.position || {},
        cssStyle: element.cssStyle || {},
        gridArea: element.gridArea || 'images'
      }));
      
      // Generate content
      const content = this.generateLayoutContent(
        layout, 
        processedTexts, 
        processedImages
      );
      
      console.log('✅ Slide generated successfully');
      
      return `
        <div class="ppt-presentation-container">
          <div class="ppt-slide ${layout.cssClass}" data-slide="${slideNumber}">
            ${content}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating slide HTML:', error);
      
      // Fallback to basic layout
      return `
        <div class="ppt-presentation-container">
          <div class="ppt-slide ppt-layout-title-content" data-slide="${slideData.slideNumber || 1}">
            <div class="ppt-content" style="padding: 2rem; text-align: center;">
              <h2>Content Preview</h2>
              <p>Unable to process slide content with advanced layout engine.</p>
              ${slideData.textElements ? slideData.textElements.map(el => `<p>${el.text || ''}</p>`).join('') : ''}
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Generate content with layout organization
   */
  generateLayoutContent(layout, texts, images) {
    switch (layout.cssClass) {
      case 'ppt-layout-title':
        return this.generateTitleLayout(texts);
      
      case 'ppt-layout-title-content':
        return this.generateTitleContentLayout(texts, images);
      
      case 'ppt-layout-two-content':
        return this.generateTwoContentLayout(texts, images);
      
      case 'ppt-layout-content-image':
        return this.generateContentImageLayout(texts, images);
      
      case 'ppt-layout-blank':
        return this.generateBlankLayout(texts, images);
      
      default:
        return this.generateTitleContentLayout(texts, images);
    }
  }
  
  generateTitleLayout(texts) {
    const title = texts.find(t => t && t.type === 'title') || texts[0] || { processedText: 'Untitled Slide', fontSize: 'var(--ppt-text-4xl)', weight: 700 };
    const subtitle = texts.find(t => t && t.type === 'subtitle') || texts[1];
    
    return `
      <div class="ppt-smart-container">
        <h1 class="ppt-title" style="font-size: ${title.fontSize || 'var(--ppt-text-4xl)'}; font-weight: ${title.weight || 700}">${this.extractText(title.processedText || title.text || 'Untitled Slide')}</h1>
        ${subtitle ? `<h2 class="ppt-subtitle" style="font-size: ${subtitle.fontSize || 'var(--ppt-text-xl)'}; font-weight: ${subtitle.weight || 400}">${this.extractText(subtitle.processedText || subtitle.text || '')}</h2>` : ''}
      </div>
    `;
  }
  
  generateTitleContentLayout(texts, images) {
    const header = texts[0] || { processedText: 'Content Slide', fontSize: 'var(--ppt-text-3xl)', weight: 600 };
    const content = texts.slice(1);
    
    return `
      <div class="ppt-smart-container">
        <h1 class="ppt-header" style="font-size: ${header.fontSize || 'var(--ppt-text-3xl)'}; font-weight: ${header.weight || 600}">${this.extractText(header.processedText || header.text || 'Content Slide')}</h1>
        <div class="ppt-content">
          ${content.map(text => text ? `<div style="margin-bottom: 0.5rem;">${text.processedText || text.text || ''}</div>` : '').join('')}
          ${this.generateImageSection(images)}
        </div>
      </div>
    `;
  }
  
  generateTwoContentLayout(texts, images) {
    const header = texts[0] || { processedText: 'Comparison', fontSize: 'var(--ppt-text-3xl)', weight: 600 };
    const leftContent = texts.slice(1, Math.ceil(texts.length / 2) + 1);
    const rightContent = texts.slice(Math.ceil(texts.length / 2) + 1);
    
    return `
      <div class="ppt-smart-container">
        <h1 class="ppt-header" style="font-size: ${header.fontSize || 'var(--ppt-text-3xl)'}; font-weight: ${header.weight || 600}">${this.extractText(header.processedText || header.text || 'Comparison')}</h1>
        <div class="ppt-content ppt-content-left">
          ${leftContent.map(text => text ? `<div style="margin-bottom: 0.5rem;">${text.processedText || text.text || ''}</div>` : '').join('')}
        </div>
        <div class="ppt-content ppt-content-right">
          ${rightContent.map(text => text ? `<div style="margin-bottom: 0.5rem;">${text.processedText || text.text || ''}</div>` : '').join('')}
          ${this.generateImageSection(images)}
        </div>
      </div>
    `;
  }
  
  generateContentImageLayout(texts, images) {
    const header = texts[0] || { processedText: 'Content with Images', fontSize: 'var(--ppt-text-3xl)', weight: 600 };
    const content = texts.slice(1);
    
    return `
      <div class="ppt-smart-container">
        <h1 class="ppt-header" style="font-size: ${header.fontSize || 'var(--ppt-text-3xl)'}; font-weight: ${header.weight || 600}">${this.extractText(header.processedText || header.text || 'Content with Images')}</h1>
        <div class="ppt-content">
          ${content.map(text => text ? `<div>${text.processedText || text.text || ''}</div>` : '').join('')}
        </div>
        ${this.generateImageSection(images)}
      </div>
    `;
  }
  
  generateBlankLayout(texts, images) {
    return `
      <div class="ppt-smart-container">
        <div class="ppt-content">
          ${texts.map(text => text ? `<div>${text.processedText || text.text || ''}</div>` : '').join('')}
          ${this.generateImageSection(images)}
        </div>
      </div>
    `;
  }
  
  /**
   * Generate image section
   */
  generateImageSection(images) {
    if (!images || images.length === 0) return '';
    
    return `
      <div class="ppt-image-container">
        ${images.map((img, index) => `
          <img src="${img.src}" alt="${img.alt || `Image ${index + 1}`}" 
               class="ppt-image" />
          ${img.caption ? `<div class="ppt-image-caption">${img.caption}</div>` : ''}
        `).join('')}
      </div>
    `;
  }

  /**
   * Extract plain text from HTML
   */
  extractText(html) {
    return html.replace(/<[^>]+>/g, '').trim();
  }

  /**
   * Generate CSS variables for dynamic theming
   */
  generateThemeCSS(theme = {}) {
    const {
      primaryColor = '#1f4e79',
      secondaryColor = '#4472c4',
      accentColor = '#70ad47',
      backgroundColor = '#ffffff',
      textColor = '#1f2328'
    } = theme;

    return `
      <style>
        :root {
          --ppt-primary: ${primaryColor};
          --ppt-secondary: ${secondaryColor};
          --ppt-accent: ${accentColor};
          --ppt-bg-primary: ${backgroundColor};
          --ppt-text-dark: ${textColor};
        }
      </style>
    `;
  }
}

export default PowerPointLayoutEngine;