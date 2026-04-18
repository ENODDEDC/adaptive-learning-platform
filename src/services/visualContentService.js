import { GroqGenAI as GoogleGenerativeAI } from '@/lib/groqGenAI';

/** Coerce client / PDF pipeline payloads so `.trim()` never throws. */
function normalizeDocxText(docxText) {
  if (docxText == null) return '';
  if (typeof docxText === 'string') return docxText;
  if (typeof docxText === 'object') {
    if (typeof docxText.text === 'string') return docxText.text;
    if (typeof docxText.rawText === 'string') return docxText.rawText;
  }
  try {
    return String(docxText);
  } catch {
    return '';
  }
}

/** Short excerpt so image / wireframe prompts stay grounded in the real document. */
function clipDocExcerpt(docxText, maxLen = 2000) {
  const t = normalizeDocxText(docxText).replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`;
}

function normalizeConcepts(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const rel = Array.isArray(c.relationships)
    ? c.relationships
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          from: String(r.from ?? ''),
          to: String(r.to ?? ''),
          type: String(r.type ?? 'relates to')
        }))
    : [];
  return {
    mainTopic:
      typeof c.mainTopic === 'string' && c.mainTopic.trim()
        ? c.mainTopic.trim()
        : 'Document',
    keyConcepts: Array.isArray(c.keyConcepts) && c.keyConcepts.length
      ? c.keyConcepts.map(String).filter(Boolean)
      : ['Main ideas'],
    processes:
      Array.isArray(c.processes) && c.processes.length
        ? c.processes.map(String).filter(Boolean)
        : ['Overview'],
    relationships: rel,
    categories:
      Array.isArray(c.categories) && c.categories.length
        ? c.categories.map(String).filter(Boolean)
        : ['General'],
    visualType: typeof c.visualType === 'string' ? c.visualType : 'diagram'
  };
}

class VisualContentService {
  constructor() {
    this.genAI = null;
    this.imageModel = null;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI();
        this.imageModel = this.genAI.getGenerativeModel({ 
          model: "gemini-flash-lite-latest" 
        });
        console.log('🎨 Visual Content Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Visual Content Service:', error);
      }
    }
  }

  /**
   * The client already runs the educational gate (/api/content/educational-gate).
   * Re-running an LLM classifier here wastes Groq tokens and often throws with the
   * text-only shim, so we always accept and rely on the client gate.
   */
  async analyzeContentForEducation(docxText) {
    const text = normalizeDocxText(docxText).trim();
    if (!text || text.length < 50) {
      return {
        isEducational: false,
        reasoning: 'Content too short to analyze',
        confidence: 0,
        contentType: 'Insufficient content'
      };
    }
    return {
      isEducational: true,
      confidence: 1,
      reasoning: 'Accepted by client-side educational gate',
      contentType: 'Educational Material'
    };
  }

  /**
   * Generate visual content based on document text (with educational analysis)
   */
  async generateVisualContent(docxText, contentType = 'diagram') {
    docxText = normalizeDocxText(docxText);
    this.initializeModels();

    const analysis = await this.analyzeContentForEducation(docxText);
    if (!analysis.isEducational) {
      throw new Error(`Content is not suitable for visual learning materials. ${analysis.reasoning}`);
    }

    const concepts = normalizeConcepts(await this.extractKeyConcepts(docxText));
    const normalizedType = ['diagram', 'infographic', 'mindmap', 'flowchart'].includes(contentType)
      ? contentType
      : 'diagram';

    return await this.generateVisualWithFallback(concepts, docxText, normalizedType);
  }

  /**
   * Extract key concepts from document text
   */
  async extractKeyConcepts(docxText) {
    this.initializeModels();

    const trimmed = normalizeDocxText(docxText).replace(/\s+/g, ' ').trim();
    const excerpt = trimmed.length > 6000 ? trimmed.slice(0, 6000) : trimmed;

    const fallback = () =>
      normalizeConcepts({
        mainTopic: 'Document Overview',
        keyConcepts: ['Main idea', 'Supporting detail', 'Key term'],
        processes: ['Introduction', 'Body', 'Conclusion'],
        relationships: [],
        categories: ['General'],
        visualType: 'diagram'
      });

    if (!this.genAI) {
      return fallback();
    }

    const prompt = [
      'You analyze a document and return ONLY a JSON object (no prose, no markdown, no code fences).',
      'Extract the real subject and concepts from the document — do not return placeholders.',
      'Schema:',
      '{',
      '  "mainTopic": "<short subject of the document, under 60 chars>",',
      '  "keyConcepts": ["<concept1>", "<concept2>", "<concept3>", "<concept4>", "<concept5>"],',
      '  "processes": ["<step1>", "<step2>", "<step3>"],',
      '  "relationships": [{"from": "<concept>", "to": "<concept>", "type": "<short verb>"}],',
      '  "categories": ["<category1>", "<category2>"],',
      '  "visualType": "diagram"',
      '}',
      'Rules:',
      '- 3 to 6 keyConcepts, each under 40 chars.',
      '- 3 to 5 processes (or summarize main stages if not procedural).',
      '- 0 to 4 relationships.',
      '- Use words taken from the document, not generic labels like "Concept 1".',
      '',
      'Document excerpt:',
      '"""',
      excerpt,
      '"""'
    ].join('\n');

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text() || '';

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return normalizeConcepts(parsed);
        } catch (parseErr) {
          console.warn('⚠️ Concepts JSON parse failed, using fallback:', parseErr?.message);
        }
      } else {
        console.warn('⚠️ Concepts response contained no JSON, using fallback');
      }
      return fallback();
    } catch (error) {
      console.error('Error extracting concepts:', error?.message || error);
      return fallback();
    }
  }

  /**
   * Generate a diagram based on concepts
   */
  async generateDiagram(concepts, docxText) {
    const excerpt = clipDocExcerpt(docxText);
    const prompt = `
    Create a clear, educational diagram that visualizes the main concepts from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Processes: ${concepts.processes.join(', ')}
    Relationships: ${concepts.relationships.map(r => `${r.from} ${r.type} ${r.to}`).join(', ')}

    Source excerpt (use for accuracy of labels and relationships; do not copy long passages verbatim):
    """${excerpt}"""

    Create a professional, clean diagram that:
    - Uses clear labels and text
    - Has good contrast and readability
    - Shows relationships between concepts
    - Is suitable for educational purposes
    - Uses a modern, minimalist design style
    - Has a white background with colored elements
    - Is landscape orientation for better readability

    Make it visually appealing and easy to understand for students.
    `;

    return await this.generateImage(prompt);
  }

  /**
   * Generate an infographic based on concepts
   */
  async generateInfographic(concepts, docxText) {
    const excerpt = clipDocExcerpt(docxText);
    const prompt = `
    Create an educational infographic that summarizes the key information from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Categories: ${concepts.categories.join(', ')}

    Source excerpt (facts and terms must match this material):
    """${excerpt}"""

    Design a modern infographic that:
    - Has a clear title and subtitle
    - Uses icons and visual elements
    - Organizes information in sections
    - Uses a cohesive color scheme (blue, green, or purple tones)
    - Has good typography and spacing
    - Is educational and informative
    - Uses a vertical layout for better mobile viewing
    - Includes visual hierarchy with different text sizes

    Make it engaging and easy to scan for quick learning.
    `;

    return await this.generateImage(prompt);
  }

  /**
   * Generate a concept network based on concepts
   */
  async generateMindMap(concepts, docxText) {
    const excerpt = clipDocExcerpt(docxText);
    const prompt = `
    Create a concept network that shows the relationships and connections between concepts from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Categories: ${concepts.categories.join(', ')}

    Source excerpt (node labels must reflect ideas from this text):
    """${excerpt}"""

    IMPORTANT: This is a CONCEPT NETWORK, NOT a mind map. Do not use the word "mind map" anywhere in the image.

    Design a concept network that:
    - Has the main topic in the center
    - Shows branches to major concepts
    - Uses different colors for different branches
    - Has clear, readable text
    - Shows connections between related ideas
    - Uses a radial layout from the center
    - Has a clean, modern design
    - Uses curved lines for organic feel
    - Has good contrast and visibility
    - Title should be: "${concepts.mainTopic} - Concept Network"
    - Subtitle should describe it as a "concept relationship network" or "interconnected concept visualization"

    Make it easy to follow the thought process and connections.
    `;

    return await this.generateImage(prompt);
  }

  /**
   * Generate a process timeline based on processes
   */
  async generateFlowchart(concepts, docxText) {
    const excerpt = clipDocExcerpt(docxText);
    const prompt = `
    Create a process timeline that shows the sequential steps and workflow described in this document.

    Main Topic: ${concepts.mainTopic}
    Processes: ${concepts.processes.join(', ')}
    Key Concepts: ${concepts.keyConcepts.join(', ')}

    Source excerpt (step wording should follow this document):
    """${excerpt}"""

    IMPORTANT: This is a PROCESS TIMELINE, NOT a flowchart. Do not use the word "flowchart" anywhere in the image.

    Design a process timeline that:
    - Shows clear chronological step-by-step progression
    - Uses a horizontal timeline layout with connected stages
    - Has clear arrows showing progression direction
    - Uses consistent styling and colors
    - Has readable text in each stage box
    - Shows sequential workflow from start to completion
    - Uses a logical left-to-right chronological flow
    - Has good spacing and alignment
    - Uses a professional color scheme
    - Title should be: "${concepts.mainTopic} - Process Timeline"
    - Subtitle should describe it as a "sequential process visualization" or "step-by-step timeline"

    Make it easy to follow the process from initiation to completion.
    `;

    return await this.generateImage(prompt);
  }

  /**
   * Generate image using Gemini image model
   */
  async generateImage(prompt) {
    this.initializeModels();
    
    if (!this.imageModel) {
      throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_TEXT_DESCRIPTION');
    }

    try {
      const result = await this.imageModel.generateContent({
        contents: [{ parts: [{ text: prompt }] }]
      });
      const genResponse =
        result?.response != null && typeof result.response.then === 'function'
          ? await result.response
          : result?.response ?? result;

      const candidate =
        genResponse?.candidates?.[0] ??
        result?.candidates?.[0] ??
        (genResponse?.response?.candidates?.[0] ?? null);

      // Groq (and other text-only shims): no image candidates → use CSS wireframe path
      if (!candidate) {
        if (typeof genResponse?.text === 'function') {
          throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_TEXT_DESCRIPTION');
        }
        throw new Error('No response received from image generation API');
      }

      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        const part = candidate.content.parts[0];

        if (part.inlineData && part.inlineData.data) {
          return {
            success: true,
            imageData: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png'
          };
        }
      }

      throw new Error('No image data found in response');
    } catch (error) {
      console.error('Error generating image:', error);

      if (
        error.message &&
        (error.message.includes('quota') || error.message.includes('429'))
      ) {
        throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_TEXT_DESCRIPTION');
      }

      throw new Error('Failed to generate image');
    }
  }

  /**
   * Generate CSS-based visual wireframe instead of image
   */
  async generateVisualWireframe(prompt, contentType, concepts, docxText = '') {
    this.initializeModels();

    try {
      if (!this.genAI) {
        return this.buildFallbackWireframe(concepts, contentType);
      }

      const excerpt = clipDocExcerpt(docxText, 1500);
      const wireframePrompt = `
      Create a detailed wireframe structure using HTML/CSS for a ${contentType} about: ${concepts?.mainTopic || 'document content'}
      
      Key Concepts: ${concepts?.keyConcepts?.join(', ') || 'general concepts'}
      Processes: ${concepts?.processes?.join(', ') || 'general processes'}

      Source excerpt (all section titles and bullets must be grounded in this material, not generic placeholders):
      """${excerpt}"""
      
      IMPORTANT: For mind maps, keep section titles SHORT (2-4 words max) and content items concise (1-2 lines max) to prevent overlap issues.
      
      Return a JSON object with this structure:
      {
        "title": "Short, clear main title (max 4-5 words)",
        "description": "Brief description of what this visual represents",
        "layout": {
          "type": "grid|flex|stack|radial",
          "direction": "horizontal|vertical|both",
          "columns": 2,
          "rows": 3
        },
        "sections": [
          {
            "id": "section1",
            "title": "Short Section Title",
            "content": ["Brief item 1", "Brief item 2", "Brief item 3"],
            "color": "#3B82F6",
            "position": { "x": 0, "y": 0, "width": 50, "height": 30 }
          }
        ],
        "connections": [
          {
            "from": "section1",
            "to": "section2",
            "type": "arrow|line|curve",
            "label": "relationship"
          }
        ],
        "style": {
          "theme": "professional|creative|minimal|colorful",
          "primaryColor": "#3B82F6",
          "secondaryColor": "#10B981",
          "accentColor": "#F59E0B"
        }
      }
      
      For each visual type, create content that's optimized for beautiful display:
      
      CONCEPT NETWORK:
      - Keep main title under 25 characters (short and impactful)
      - Keep section titles under 15 characters (clear and concise)
      - Keep content items under 30 characters each (perfect fit in fixed cards)
      - Use exactly 4-5 sections for optimal spacing
      - Focus on key concepts that connect logically
      - Use bullet points that are brief and clear
      - Avoid long sentences or complex phrases
      - Title should be: "Concept Network" (never "Mind Map")
      - Describe as "concept network" or "relationship network"
      
      PROCESS TIMELINE:
      - Create 3-5 clear sequential steps in chronological order
      - Use action-oriented titles (e.g., "Analyze Data", "Generate Report")
      - Keep each step description under 50 characters
      - Ensure logical chronological flow from start to finish
      - Title should be: "Process Timeline" (never "Flowchart")
      - Describe as "sequential process" or "timeline visualization"
      
      INFOGRAPHIC:
      - Create 2-4 visually distinct sections
      - Use descriptive titles that highlight key information
      - Include statistics, facts, or key points
      - Keep content items concise and impactful
      
      DIAGRAM:
      - Create 2-6 interconnected concepts
      - Use clear, technical titles where appropriate
      - Focus on relationships between concepts
      - Keep descriptions precise and educational
      
      Make it educational and visually clear for learning purposes.
      `;

      const model = this.genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
      const result = await model.generateContent(wireframePrompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const wireframeData = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            wireframeData,
            isWireframe: true,
            contentType
          };
        } catch (parseErr) {
          console.warn('⚠️ Wireframe JSON parse failed, using synthesized fallback:', parseErr?.message);
        }
      } else {
        console.warn('⚠️ No JSON object in wireframe response, using synthesized fallback');
      }

      return this.buildFallbackWireframe(concepts, contentType);
    } catch (error) {
      console.error('Error generating wireframe (using synthesized fallback):', error?.message || error);
      return this.buildFallbackWireframe(concepts, contentType);
    }
  }

  /** Synthesize a minimal wireframe from extracted concepts when the model fails. */
  buildFallbackWireframe(concepts, contentType) {
    const c = normalizeConcepts(concepts);
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
    const title = c.mainTopic || 'Document';

    const items =
      contentType === 'flowchart'
        ? c.processes.slice(0, 5)
        : c.keyConcepts.slice(0, 5);

    const sections = items.length
      ? items.map((t, i) => ({
          id: `s${i + 1}`,
          title: String(t).slice(0, 40),
          content: [String(t).slice(0, 60)],
          color: palette[i % palette.length]
        }))
      : [
          {
            id: 's1',
            title: 'Overview',
            content: [title.slice(0, 60)],
            color: palette[0]
          }
        ];

    const connections =
      contentType === 'flowchart'
        ? sections.slice(0, -1).map((s, i) => ({
            from: s.id,
            to: sections[i + 1].id,
            type: 'arrow',
            label: 'next'
          }))
        : [];

    return {
      success: true,
      isWireframe: true,
      contentType,
      wireframeData: {
        title,
        description: `Auto-generated ${contentType} for ${title}`,
        layout: {
          type: contentType === 'flowchart' ? 'flex' : 'grid',
          direction: contentType === 'flowchart' ? 'horizontal' : 'both',
          columns: Math.min(3, sections.length),
          rows: Math.ceil(sections.length / 3)
        },
        sections,
        connections,
        style: {
          theme: 'professional',
          primaryColor: palette[0],
          secondaryColor: palette[1],
          accentColor: palette[2]
        }
      }
    };
  }

  /**
   * Generate multiple visual content types (with educational analysis)
   */
  async generateMultipleVisuals(docxText) {
    docxText = normalizeDocxText(docxText);
    try {
      // First, analyze if content is educational
      const analysis = await this.analyzeContentForEducation(docxText);
      
      if (!analysis.isEducational) {
        throw new Error(`Content is not suitable for visual learning materials. ${analysis.reasoning}`);
      }

      console.log('✅ Content approved for multiple visual learning generation');
      
      const concepts = normalizeConcepts(await this.extractKeyConcepts(docxText));
      
      const diagram = await this.generateVisualWithFallback(concepts, docxText, 'diagram');
      const infographic = await this.generateVisualWithFallback(concepts, docxText, 'infographic');
      const mindmap = await this.generateVisualWithFallback(concepts, docxText, 'mindmap');
      const flowchart = await this.generateVisualWithFallback(concepts, docxText, 'flowchart');

      return {
        success: true,
        visuals: {
          diagram,
          infographic,
          mindmap,
          flowchart
        },
        concepts,
        analysis
      };
    } catch (error) {
      console.error('Error generating multiple visuals:', error);
      throw new Error(error?.message || 'Failed to generate visual content');
    }
  }

  /**
   * Generate visual content with fallback to text description
   */
  async generateVisualWithFallback(concepts, docxText, contentType) {
    try {
      let visualContent;
      
      switch (contentType) {
        case 'diagram':
          visualContent = await this.generateDiagram(concepts, docxText);
          break;
        case 'infographic':
          visualContent = await this.generateInfographic(concepts, docxText);
          break;
        case 'mindmap':
          visualContent = await this.generateMindMap(concepts, docxText);
          break;
        case 'flowchart':
          visualContent = await this.generateFlowchart(concepts, docxText);
          break;
        default:
          throw new Error('Unknown content type');
      }

      return visualContent;
    } catch (error) {
      console.log(`🔄 Image generation failed for ${contentType}, falling back to text description...`);

      const useWireframeFallback =
        error.message?.includes('QUOTA_EXCEEDED_FALLBACK_TO_TEXT_DESCRIPTION') ||
        error.message?.includes('Failed to generate image') ||
        error.message?.includes('No image data found') ||
        error.message?.includes('No response received from image generation');

      if (useWireframeFallback) {
        try {
          // Get the original prompt based on content type
          let prompt;
          switch (contentType) {
            case 'diagram':
              prompt = this.getDiagramPrompt(concepts, docxText);
              break;
            case 'infographic':
              prompt = this.getInfographicPrompt(concepts, docxText);
              break;
            case 'mindmap':
              prompt = this.getMindMapPrompt(concepts, docxText);
              break;
            case 'flowchart':
              prompt = this.getFlowchartPrompt(concepts, docxText);
              break;
            default:
              prompt = 'Visual content description';
          }

          const fallbackContent = await this.generateVisualWireframe(prompt, contentType, concepts, docxText);
          return fallbackContent;
        } catch (fallbackError) {
          console.error(`Error generating wireframe fallback for ${contentType}:`, fallbackError);
          return { 
            error: `Image generation quota exceeded. Please try again later or upgrade your plan.`,
            isFallback: true 
          };
        }
      }
      
      return { error: error.message };
    }
  }

  /**
   * Helper methods to get prompts for each content type
   */
  getDiagramPrompt(concepts, docxText) {
    return `
    Create a clear, educational diagram that visualizes the main concepts from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Processes: ${concepts.processes.join(', ')}
    Relationships: ${concepts.relationships.map(r => `${r.from} ${r.type} ${r.to}`).join(', ')}

    Create a professional, clean diagram that:
    - Uses clear labels and text
    - Has good contrast and readability
    - Shows relationships between concepts
    - Is suitable for educational purposes
    - Uses a modern, minimalist design style
    - Has a white background with colored elements
    - Is landscape orientation for better readability

    Make it visually appealing and easy to understand for students.
    `;
  }

  getInfographicPrompt(concepts, docxText) {
    return `
    Create an educational infographic that summarizes the key information from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Categories: ${concepts.categories.join(', ')}

    Design a modern infographic that:
    - Has a clear title and subtitle
    - Uses icons and visual elements
    - Organizes information in sections
    - Uses a cohesive color scheme (blue, green, or purple tones)
    - Has good typography and spacing
    - Is educational and informative
    - Uses a vertical layout for better mobile viewing
    - Includes visual hierarchy with different text sizes

    Make it engaging and easy to scan for quick learning.
    `;
  }

  getMindMapPrompt(concepts, docxText) {
    return `
    Create a concept network that shows the relationships and connections between concepts from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Categories: ${concepts.categories.join(', ')}

    IMPORTANT: This is a CONCEPT NETWORK, NOT a mind map. Do not use the word "mind map" anywhere.

    Design a concept network that:
    - Has the main topic in the center
    - Shows branches to major concepts
    - Uses different colors for different branches
    - Has clear, readable text
    - Shows connections between related ideas
    - Uses a radial layout from the center
    - Has a clean, modern design
    - Uses curved lines for organic feel
    - Has good contrast and visibility
    - Title should be: "${concepts.mainTopic} - Concept Network"
    - Subtitle should describe it as a "concept relationship network" or "interconnected concept visualization"

    Make it easy to follow the thought process and connections.
    `;
  }

  getFlowchartPrompt(concepts, docxText) {
    return `
    Create a process timeline that shows the sequential steps and workflow described in this document.

    Main Topic: ${concepts.mainTopic}
    Processes: ${concepts.processes.join(', ')}
    Key Concepts: ${concepts.keyConcepts.join(', ')}

    IMPORTANT: This is a PROCESS TIMELINE, NOT a flowchart. Do not use the word "flowchart" anywhere.

    Design a process timeline that:
    - Shows clear chronological step-by-step progression
    - Uses a horizontal timeline layout with connected stages
    - Has clear arrows showing progression direction
    - Uses consistent styling and colors
    - Has readable text in each stage box
    - Shows sequential workflow from start to completion
    - Uses a logical left-to-right chronological flow
    - Has good spacing and alignment
    - Uses a professional color scheme
    - Title should be: "${concepts.mainTopic} - Process Timeline"
    - Describe it as a "sequential process visualization" or "step-by-step timeline"

    Make it easy to follow the process from initiation to completion.
    `;
  }
}

export default new VisualContentService();
