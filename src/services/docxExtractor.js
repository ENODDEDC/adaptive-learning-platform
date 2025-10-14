import mammoth from 'mammoth';

class DocxExtractor {
  /**
   * Extract text content from DOCX buffer
   */
  async extractText(docxBuffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX file');
    }
  }

  /**
   * Extract text with enhanced formatting (HTML)
   */
  async extractHTML(docxBuffer) {
    try {
      // Enhanced style mapping for better formatting preservation
      const styleMap = [
        // Paragraph styles
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Subtitle'] => p.subtitle:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense:fresh",
        
        // Character styles
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "r[style-name='Subtle Emphasis'] => em.subtle",
        "r[style-name='Intense Emphasis'] => strong.intense",
        
        // List styles
        "p[style-name='List Paragraph'] => p.list-paragraph",
        
        // Default paragraph with better spacing
        "p => p:fresh"
      ];

      const options = {
        buffer: docxBuffer,
        styleMap: styleMap,
        
        // Transform functions for better formatting
        transformDocument: mammoth.transforms.paragraph(function(paragraph) {
          // Add proper spacing classes based on paragraph type
          if (paragraph.styleId) {
            switch (paragraph.styleId) {
              case 'Title':
              case 'Heading1':
                return { ...paragraph, styleName: 'document-title' };
              case 'Heading2':
                return { ...paragraph, styleName: 'section-heading' };
              case 'Heading3':
                return { ...paragraph, styleName: 'subsection-heading' };
              default:
                return paragraph;
            }
          }
          return paragraph;
        }),
        
        // Better image handling
        convertImage: mammoth.images.imgElement(function(image) {
          return image.read("base64").then(function(imageBuffer) {
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer,
              alt: image.altText || "Document image",
              class: "document-image"
            };
          });
        })
      };

      const result = await mammoth.convertToHtml(options);
      
      // Post-process HTML for better formatting
      let html = result.value;
      
      // Add semantic classes and improve structure
      html = this.enhanceHtmlStructure(html);
      
      return html;
    } catch (error) {
      console.error('Error extracting HTML from DOCX:', error);
      throw new Error('Failed to extract HTML from DOCX file');
    }
  }

  /**
   * Enhance HTML structure for better formatting
   */
  enhanceHtmlStructure(html) {
    // Add proper paragraph spacing and classes
    html = html.replace(/<p><\/p>/g, '<p class="empty-paragraph">&nbsp;</p>');
    
    // Enhance headings with proper hierarchy
    html = html.replace(/<h1>/g, '<h1 class="document-title">');
    html = html.replace(/<h2>/g, '<h2 class="section-heading">');
    html = html.replace(/<h3>/g, '<h3 class="subsection-heading">');
    
    // Add classes to paragraphs for better styling
    html = html.replace(/<p>(?!<\/p>)/g, '<p class="document-paragraph">');
    
    // Enhance lists
    html = html.replace(/<ul>/g, '<ul class="document-list">');
    html = html.replace(/<ol>/g, '<ol class="document-list numbered">');
    
    // Enhance tables
    html = html.replace(/<table>/g, '<table class="document-table">');
    
    // Add wrapper for better document structure
    html = `<div class="document-content">${html}</div>`;
    
    return html;
  }

  /**
   * Extract structured content with headings and paragraphs
   */
  async extractStructuredContent(docxBuffer) {
    try {
      const htmlResult = await mammoth.convertToHtml({ buffer: docxBuffer });
      const html = htmlResult.value;
      
      // Parse HTML to extract structured content
      const sections = this.parseHTMLToSections(html);
      
      return {
        rawText: await this.extractText(docxBuffer),
        html: html,
        sections: sections
      };
    } catch (error) {
      console.error('Error extracting structured content from DOCX:', error);
      throw new Error('Failed to extract structured content from DOCX file');
    }
  }

  /**
   * Parse HTML content into structured sections
   */
  parseHTMLToSections(html) {
    const sections = [];
    
    // Simple HTML parsing to identify sections
    const lines = html.split('\n').filter(line => line.trim());
    let currentSection = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Check for headings
      if (trimmed.match(/<h[1-6]>/i)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        
        const headingText = trimmed.replace(/<[^>]*>/g, '').trim();
        currentSection = {
          type: 'section',
          title: headingText,
          content: []
        };
      } else if (trimmed.match(/<p>/i) && currentSection) {
        const paragraphText = trimmed.replace(/<[^>]*>/g, '').trim();
        if (paragraphText) {
          currentSection.content.push({
            type: 'paragraph',
            text: paragraphText
          });
        }
      } else if (trimmed && !currentSection) {
        // Content without heading
        if (!sections.find(s => s.title === 'Introduction')) {
          currentSection = {
            type: 'section',
            title: 'Introduction',
            content: []
          };
        }
        
        const text = trimmed.replace(/<[^>]*>/g, '').trim();
        if (text && currentSection) {
          currentSection.content.push({
            type: 'paragraph',
            text: text
          });
        }
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Get document statistics
   */
  getDocumentStats(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(para => para.trim().length > 0);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      characterCount: text.length,
      readingTime: Math.ceil(words.length / 200) // Assuming 200 words per minute
    };
  }
}

export default new DocxExtractor();