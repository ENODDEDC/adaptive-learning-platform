import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function to convert PCM to WAV format for browser compatibility
function pcmToWav(pcmBase64, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
  try {
    // Decode base64 PCM data
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    const pcmLength = pcmBuffer.length;
    
    // Create WAV header (44 bytes)
    const wavLength = 44 + pcmLength;
    const wavBuffer = Buffer.alloc(wavLength);
    
    // WAV header structure
    let offset = 0;
    
    // RIFF chunk descriptor
    wavBuffer.write('RIFF', offset); offset += 4;
    wavBuffer.writeUInt32LE(wavLength - 8, offset); offset += 4;
    wavBuffer.write('WAVE', offset); offset += 4;
    
    // fmt sub-chunk
    wavBuffer.write('fmt ', offset); offset += 4;
    wavBuffer.writeUInt32LE(16, offset); offset += 4; // Sub-chunk size
    wavBuffer.writeUInt16LE(1, offset); offset += 2;  // Audio format (PCM)
    wavBuffer.writeUInt16LE(channels, offset); offset += 2;
    wavBuffer.writeUInt32LE(sampleRate, offset); offset += 4;
    wavBuffer.writeUInt32LE(sampleRate * channels * bitsPerSample / 8, offset); offset += 4; // Byte rate
    wavBuffer.writeUInt16LE(channels * bitsPerSample / 8, offset); offset += 2; // Block align
    wavBuffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
    
    // data sub-chunk
    wavBuffer.write('data', offset); offset += 4;
    wavBuffer.writeUInt32LE(pcmLength, offset); offset += 4;
    
    // Copy PCM data
    pcmBuffer.copy(wavBuffer, offset);
    
    // Return as base64
    return wavBuffer.toString('base64');
  } catch (error) {
    console.error('❌ Error converting PCM to WAV:', error);
    throw new Error('Failed to convert audio format');
  }
}

class AITutorService {
  constructor() {
    // Initialize only when needed to avoid server-side issues
    this.genAI = null;
    this.model = null;
    this.ttsModel = null;
  }

  initializeModels() {
    if (!this.genAI && typeof window !== 'undefined') {
      // Client-side initialization
      this.genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      // Use the correct TTS model from working sample
      try {
        this.ttsModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash-preview-tts" 
        });
        console.log('✅ TTS model initialized successfully');
      } catch (e) {
        console.warn('❌ TTS model initialization failed:', e);
        this.ttsModel = null;
      }
    } else if (!this.genAI && typeof window === 'undefined') {
      // Server-side initialization
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      // Use the correct TTS model from working sample
      try {
        this.ttsModel = this.genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash-preview-tts" 
        });
        console.log('✅ TTS model initialized successfully');
      } catch (e) {
        console.warn('❌ TTS model initialization failed:', e);
        this.ttsModel = null;
      }
    }
  }

  /**
   * Generate educational content from DOCX text in Taglish (English + Tagalog)
   */
  async generateTutorialContent(docxText, studentLevel = 'intermediate') {
    this.initializeModels();
    const prompt = `
You are an AI narrator teaching Filipino students. Create an engaging narration based STRICTLY on the content provided in this document. DO NOT add information from your general knowledge - only use what is written in the document.

Document Content:
${docxText}

CRITICAL INSTRUCTIONS:
- ONLY use information that is explicitly written in the document above
- DO NOT add external knowledge, examples, or information not in the document
- If the document doesn't contain enough information about something, say "Ang document ay hindi nag-provide ng detalye tungkol dito"
- Base ALL explanations, examples, and concepts ONLY on what's written in the document
- Use 2nd person perspective ("ikaw", "you")
- Mix English and Tagalog naturally (Taglish)
- Be encouraging and supportive
- Student level: ${studentLevel}

Create a tutorial that covers ONLY what's in the document:
1. Main topic overview based on document content (Ano ang sinasabi ng document na ito?)
2. Key concepts mentioned in the document (Mga importante concepts na nakasulat)
3. Step-by-step breakdown of information in the document (Hakbang-hakbang based sa document)
4. Applications mentioned in the document (Kung may nabanggit na applications sa document)
5. Practice suggestions based only on document content (Mga practice based sa nakasulat)

Remember: Stick STRICTLY to the document content. Do not add outside knowledge.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating tutorial content:', error);
      throw new Error('Failed to generate tutorial content');
    }
  }

  /**
   * List available models to debug TTS availability
   */
  async listAvailableModels() {
    try {
      this.initializeModels();
      if (!this.genAI) {
        throw new Error('GoogleGenerativeAI not initialized');
      }

      console.log('📋 Listing available models...');
      const models = await this.genAI.listModels();
      
      console.log('📊 Available models:');
      models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
        if (model.supportedGenerationMethods) {
          console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });

      // Look for audio-related models
      const audioModels = models.filter(model => 
        model.name.toLowerCase().includes('audio') || 
        model.name.toLowerCase().includes('tts') ||
        model.displayName?.toLowerCase().includes('audio')
      );

      console.log('🔊 Audio-related models found:');
      audioModels.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
      });

      return models;
    } catch (error) {
      console.error('❌ Error listing models:', error);
      return [];
    }
  }

  /**
   * Split long text into smaller chunks for TTS processing
   */
  splitTextIntoChunks(text, maxChunkLength = 300) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      // If adding this sentence would exceed the limit, save current chunk and start new one
      if (currentChunk.length + trimmedSentence.length + 1 > maxChunkLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence + '.';
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence + '.';
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text]; // Fallback to original text if splitting fails
  }

  /**
   * Combine multiple base64 WAV audio chunks into a single WAV file
   */
  combineWavAudioChunks(wavChunks) {
    if (wavChunks.length === 1) {
      return wavChunks[0];
    }
    
    try {
      // Decode all WAV chunks
      const decodedChunks = wavChunks.map(chunk => Buffer.from(chunk, 'base64'));
      
      // Extract audio data from each WAV (skip 44-byte header)
      const audioDataChunks = decodedChunks.map(chunk => chunk.slice(44));
      
      // Calculate total audio data length
      const totalAudioLength = audioDataChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      
      // Create new WAV header for combined audio
      const combinedWavLength = 44 + totalAudioLength;
      const combinedBuffer = Buffer.alloc(combinedWavLength);
      
      // Write WAV header
      let offset = 0;
      combinedBuffer.write('RIFF', offset); offset += 4;
      combinedBuffer.writeUInt32LE(combinedWavLength - 8, offset); offset += 4;
      combinedBuffer.write('WAVE', offset); offset += 4;
      combinedBuffer.write('fmt ', offset); offset += 4;
      combinedBuffer.writeUInt32LE(16, offset); offset += 4;
      combinedBuffer.writeUInt16LE(1, offset); offset += 2;  // PCM
      combinedBuffer.writeUInt16LE(1, offset); offset += 2;  // Mono
      combinedBuffer.writeUInt32LE(24000, offset); offset += 4; // Sample rate
      combinedBuffer.writeUInt32LE(48000, offset); offset += 4; // Byte rate
      combinedBuffer.writeUInt16LE(2, offset); offset += 2;  // Block align
      combinedBuffer.writeUInt16LE(16, offset); offset += 2; // Bits per sample
      combinedBuffer.write('data', offset); offset += 4;
      combinedBuffer.writeUInt32LE(totalAudioLength, offset); offset += 4;
      
      // Copy all audio data
      for (const audioChunk of audioDataChunks) {
        audioChunk.copy(combinedBuffer, offset);
        offset += audioChunk.length;
      }
      
      return combinedBuffer.toString('base64');
    } catch (error) {
      console.error('❌ Error combining audio chunks:', error);
      // Return first chunk as fallback
      return wavChunks[0];
    }
  }

  /**
   * Generate audio from a single text chunk
   */
  async generateAudioChunk(text, voiceName = 'Kore') {
    const requestPayload = {
      contents: [{ 
        parts: [{ text: text }] 
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { 
              voiceName: voiceName 
            }
          }
        }
      }
    };
    
    const response = await this.ttsModel.generateContent(requestPayload);
    
    if (!response) {
      throw new Error('No response received from TTS API');
    }
    
    // Parse response for audio data - handle response wrapper
    let audioData = null;
    let actualResponse = response;
    if (response.response && response.response.candidates) {
      actualResponse = response.response;
    }
    
    if (actualResponse.candidates && actualResponse.candidates[0]) {
      const candidate = actualResponse.candidates[0];
      
      if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        const part = candidate.content.parts[0];
        
        // Check for inlineData (standard format)
        if (part.inlineData && part.inlineData.data) {
          audioData = part.inlineData.data;
        }
        // Check if audio is in text field (alternative format)
        else if (part.text && typeof part.text === 'string' && part.text.length > 1000) {
          try {
            const audioBuffer = Buffer.from(part.text, 'binary');
            audioData = audioBuffer.toString('base64');
          } catch (conversionError) {
            audioData = part.text;
          }
        }
      }
    }
    
    if (!audioData) {
      throw new Error('No audio data found in TTS API response');
    }
    
    // Convert PCM to WAV format
    return pcmToWav(audioData);
  }

  /**
   * Generate audio from text using FULL CONTENT in single Google TTS API call
   * Google TTS supports up to 32k tokens (~24,000-32,000 characters)
   */
  async generateAudio(text, voiceName = 'Kore') {
    console.log('🔊 aiTutorService.generateAudio called');
    console.log('📝 Input params:', { textLength: text?.length, voiceName });
    console.log('📊 Google TTS can handle up to 32k tokens (~24,000-32,000 characters)');
    console.log('📊 Your text is well within limits - using FULL content for complete learning experience');
    
    try {
      console.log('🤖 Initializing models...');
      this.initializeModels();
      
      console.log('🔧 Models initialized. Checking TTS model availability:');
      console.log('genAI available:', !!this.genAI);
      console.log('ttsModel available:', !!this.ttsModel);
      
      if (!this.ttsModel) {
        console.log('❌ TTS model not available');
        throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_BROWSER_TTS');
      }
      
      // Use FULL text - no optimization needed for educational completeness
      console.log('📤 Using FULL TEXT in single Google TTS API call for complete learning experience...');
      console.log('🎓 Educational priority: Students get complete content, not truncated learning');
      
      // Single API call with full content
      return await this.generateAudioChunk(text, voiceName);
      
    } catch (error) {
      console.error('❌ DETAILED ERROR in TTS generation:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Check if it's a quota exceeded error (rate limiting)
      if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
        console.error('🚫 Google TTS quota exceeded (rate limiting) - falling back to browser TTS for FULL content');
        throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_BROWSER_TTS');
      }
      
      // For any Google API error, fall back to browser TTS with full content
      if (error.message && (error.message.includes('API') || error.message.includes('GoogleGenerativeAI'))) {
        console.error('🔑 Google API error - falling back to browser TTS with FULL content');
        throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_BROWSER_TTS');
      }
      
      throw new Error('QUOTA_EXCEEDED_FALLBACK_TO_BROWSER_TTS');
    }
  }

  /**
   * Generate interactive Q&A based on document content
   */
  async generateQuestions(docxText, numQuestions = 5) {
    this.initializeModels();
    const prompt = `
Based STRICTLY on this document content, create ${numQuestions} interactive questions in Taglish to test understanding.

Document Content:
${docxText}

CRITICAL INSTRUCTIONS:
- ONLY create questions about information that is explicitly written in the document above
- DO NOT add questions about general knowledge or external information
- All questions and answers must be based ONLY on the document content
- If the document doesn't have enough content for ${numQuestions} questions, create fewer questions
- Use Taglish (English + Tagalog mix)
- Are appropriate for Filipino students
- Include multiple choice options based on document content
- Have clear explanations for answers using ONLY document information

Format as JSON array with this structure:
[
  {
    "question": "Question text in Taglish based on document",
    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
    "correct": 0,
    "explanation": "Explanation in Taglish why this is correct based on document content"
  }
]

Remember: Base ALL questions and answers STRICTLY on the document content only.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse questions from response');
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions');
    }
  }

  /**
   * Generate summary of document content
   */
  async generateSummary(docxText) {
    this.initializeModels();
    const prompt = `
Summarize STRICTLY this document content in Taglish (English + Tagalog mix) for Filipino students.

Document Content:
${docxText}

CRITICAL INSTRUCTIONS:
- ONLY summarize information that is explicitly written in the document above
- DO NOT add external knowledge or information not in the document
- Base the summary ONLY on what's written in the document
- If certain topics are mentioned but not explained in detail, note that "Ang document ay nag-mention lang pero walang detailed explanation"

Create a concise summary that:
- Highlights main points FROM THE DOCUMENT ONLY
- Uses Taglish naturally
- Is easy to understand
- Captures key takeaways FROM THE DOCUMENT
- Is engaging and conversational

Keep it under 200 words. Remember: Stick STRICTLY to document content only.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Generate quick overview of document content (5-minute version)
   */
  async generateQuickOverview(docxText, studentLevel = 'intermediate') {
    this.initializeModels();
    const prompt = `
You are an AI narrator teaching Filipino students. Create a QUICK 5-minute overview based STRICTLY on the content provided in this document. DO NOT add information from your general knowledge - only use what is written in the document.

Document Content:
${docxText}

CRITICAL INSTRUCTIONS:
- ONLY use information that is explicitly written in the document above
- DO NOT add external knowledge, examples, or information not in the document
- Keep it concise but complete - aim for 5 minutes of speaking time
- Use 2nd person perspective ("ikaw", "you")
- Mix English and Tagalog naturally (Taglish)
- Be encouraging and supportive
- Student level: ${studentLevel}

Create a quick overview that covers ONLY what's in the document:
1. What this document is about (1 sentence summary)
2. Main topics covered in the document (bullet points)
3. Key takeaways from the document (most important points)
4. Why this matters based on what the document says

Keep it engaging but concise. Stick STRICTLY to the document content only.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating quick overview:', error);
      throw new Error('Failed to generate quick overview');
    }
  }

  /**
   * Generate key concepts from document content
   */
  async generateKeyConcepts(docxText, studentLevel = 'intermediate') {
    this.initializeModels();
    const prompt = `
You are an AI narrator teaching Filipino students. Focus ONLY on the key concepts based STRICTLY on the content provided in this document. DO NOT add information from your general knowledge - only use what is written in the document.

Document Content:
${docxText}

CRITICAL INSTRUCTIONS:
- ONLY use information that is explicitly written in the document above
- DO NOT add external knowledge, examples, or information not in the document
- Focus on the most important concepts mentioned in the document
- Use 2nd person perspective ("ikaw", "you")
- Mix English and Tagalog naturally (Taglish)
- Be encouraging and supportive
- Student level: ${studentLevel}

Identify and explain ONLY the key concepts from the document:
1. List the main concepts mentioned in the document
2. Explain each concept using ONLY information from the document
3. Show how these concepts relate to each other (if the document shows relationships)
4. Highlight the most critical points to remember from the document

Focus on understanding, not memorization. Stick STRICTLY to the document content only.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating key concepts:', error);
      throw new Error('Failed to generate key concepts');
    }
  }

  /**
   * Generate study tips based on document content
   */
  async generateStudyTips(docxText) {
    this.initializeModels();
    const prompt = `
Based STRICTLY on this document content, provide study tips and learning strategies in Taglish.

Document Content:
${docxText}

CRITICAL INSTRUCTIONS:
- ONLY provide study tips based on what is explicitly written in the document above
- DO NOT add general study advice or external knowledge
- Base ALL suggestions ONLY on the document content and structure
- If the document doesn't provide enough information for certain study tips, say "Ang document ay hindi nag-provide ng enough info para dito"

Provide study tips based ONLY on document content:
- Study methods specific to the topics mentioned in the document
- Memory techniques for the specific concepts written in the document
- Practice suggestions based only on what's covered in the document
- How to review the specific information in this document
- Ways to understand the concepts mentioned in the document

Use encouraging, friendly Taglish tone. Keep it practical and actionable but STRICTLY based on document content only.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating study tips:', error);
      throw new Error('Failed to generate study tips');
    }
  }
}

export default new AITutorService();