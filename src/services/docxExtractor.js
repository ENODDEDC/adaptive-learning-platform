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
   * Extract text with basic formatting (HTML)
   */
  async extractHTML(docxBuffer) {
    try {
      const result = await mammoth.convertToHtml({ buffer: docxBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting HTML from DOCX:', error);
      throw new Error('Failed to extract HTML from DOCX file');
    }
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