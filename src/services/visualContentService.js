import { GoogleGenerativeAI } from '@google/generative-ai';

class VisualContentService {
  constructor() {
    this.genAI = null;
    this.imageModel = null;
  }

  initializeModels() {
    if (!this.genAI) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
        this.imageModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash-image" 
        });
        console.log('🎨 Visual Content Service initialized');
      } catch (error) {
        console.error('❌ Error initializing Visual Content Service:', error);
      }
    }
  }

  /**
   * Generate visual content based on document text
   */
  async generateVisualContent(docxText, contentType = 'diagram') {
    this.initializeModels();
    
    if (!this.imageModel) {
      throw new Error('Visual content model not available');
    }

    try {
      // Extract key concepts from the document
      const concepts = await this.extractKeyConcepts(docxText);
      
      // Generate appropriate visual content based on type
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
          visualContent = await this.generateDiagram(concepts, docxText);
      }

      return visualContent;
    } catch (error) {
      console.error('Error generating visual content:', error);
      throw new Error('Failed to generate visual content');
    }
  }

  /**
   * Extract key concepts from document text
   */
  async extractKeyConcepts(docxText) {
    this.initializeModels();
    
    if (!this.genAI) {
      throw new Error('Google AI service not available');
    }

    const prompt = `
    Analyze this document and extract the main concepts, topics, and key information that would be useful for creating visual learning materials.

    Document Content:
    ${docxText}

    Extract and return a JSON object with:
    {
      "mainTopic": "Main subject of the document",
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "processes": ["step1", "step2", "step3"],
      "relationships": [{"from": "concept1", "to": "concept2", "type": "causes"}],
      "categories": ["category1", "category2"],
      "visualType": "diagram|infographic|mindmap|flowchart"
    }

    Focus on concepts that would benefit from visual representation.
    `;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if JSON parsing fails
      return {
        mainTopic: "Document Analysis",
        keyConcepts: ["Key Concept 1", "Key Concept 2"],
        processes: ["Step 1", "Step 2"],
        relationships: [],
        categories: ["General"],
        visualType: "diagram"
      };
    } catch (error) {
      console.error('Error extracting concepts:', error);
      return {
        mainTopic: "Document Analysis",
        keyConcepts: ["Key Concept 1", "Key Concept 2"],
        processes: ["Step 1", "Step 2"],
        relationships: [],
        categories: ["General"],
        visualType: "diagram"
      };
    }
  }

  /**
   * Generate a diagram based on concepts
   */
  async generateDiagram(concepts, docxText) {
    const prompt = `
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

    return await this.generateImage(prompt);
  }

  /**
   * Generate an infographic based on concepts
   */
  async generateInfographic(concepts, docxText) {
    const prompt = `
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

    return await this.generateImage(prompt);
  }

  /**
   * Generate a concept network based on concepts
   */
  async generateMindMap(concepts, docxText) {
    const prompt = `
    Create a concept network that shows the relationships and connections between concepts from this document.

    Main Topic: ${concepts.mainTopic}
    Key Concepts: ${concepts.keyConcepts.join(', ')}
    Categories: ${concepts.categories.join(', ')}

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
    const prompt = `
    Create a process timeline that shows the sequential steps and workflow described in this document.

    Main Topic: ${concepts.mainTopic}
    Processes: ${concepts.processes.join(', ')}
    Key Concepts: ${concepts.keyConcepts.join(', ')}

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
      const response = await this.imageModel.generateContent({
        contents: [{ parts: [{ text: prompt }] }]
      });

      if (!response || !response.candidates || !response.candidates[0]) {
        throw new Error('No response received from image generation API');
      }

      const candidate = response.candidates[0];
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
      
      // Check if it's a quota exceeded error
      if (error.message && error.message.includes('quota') || error.message && error.message.includes('429')) {
        throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_TEXT_DESCRIPTION');
      }
      
      throw new Error('Failed to generate image');
    }
  }

  /**
   * Generate CSS-based visual wireframe instead of image
   */
  async generateVisualWireframe(prompt, contentType, concepts) {
    this.initializeModels();
    
    if (!this.genAI) {
      throw new Error('Text generation model not available');
    }

    try {
      const wireframePrompt = `
      Create a detailed wireframe structure using HTML/CSS for a ${contentType} about: ${concepts?.mainTopic || 'document content'}
      
      Key Concepts: ${concepts?.keyConcepts?.join(', ') || 'general concepts'}
      Processes: ${concepts?.processes?.join(', ') || 'general processes'}
      
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

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const wireframeData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          wireframeData: wireframeData,
          isWireframe: true,
          contentType: contentType
        };
      }

      throw new Error('Could not parse wireframe data from response');
    } catch (error) {
      console.error('Error generating wireframe:', error);
      throw new Error('Failed to generate wireframe');
    }
  }

  /**
   * Generate multiple visual content types
   */
  async generateMultipleVisuals(docxText) {
    try {
      const concepts = await this.extractKeyConcepts(docxText);
      
      const [diagram, infographic, mindmap, flowchart] = await Promise.all([
        this.generateVisualWithFallback(concepts, docxText, 'diagram'),
        this.generateVisualWithFallback(concepts, docxText, 'infographic'),
        this.generateVisualWithFallback(concepts, docxText, 'mindmap'),
        this.generateVisualWithFallback(concepts, docxText, 'flowchart')
      ]);

      return {
        success: true,
        visuals: {
          diagram,
          infographic,
          mindmap,
          flowchart
        },
        concepts
      };
    } catch (error) {
      console.error('Error generating multiple visuals:', error);
      throw new Error('Failed to generate visual content');
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
      
      if (error.message.includes('QUOTA_EXCEEDED_FALLBACK_TO_TEXT_DESCRIPTION')) {
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

          const fallbackContent = await this.generateVisualWireframe(prompt, contentType, concepts);
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
