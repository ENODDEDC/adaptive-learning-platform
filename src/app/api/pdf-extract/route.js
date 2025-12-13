import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import backblazeService from '@/services/backblazeService';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { fileKey, filePath } = await request.json();

    if (!fileKey && !filePath) {
      return NextResponse.json(
        { error: 'Either fileKey or filePath is required' },
        { status: 400 }
      );
    }

    console.log('📄 Starting PDF text extraction...');
    console.log('File key:', fileKey);
    console.log('File path:', filePath);

    // Determine the final file key
    let finalFileKey = fileKey;
    
    if (!finalFileKey && filePath) {
      console.log('🔍 Extracting key from file path...');
      if (filePath.startsWith('/api/files/')) {
        finalFileKey = decodeURIComponent(filePath.replace('/api/files/', ''));
      } else {
        finalFileKey = filePath;
      }
    }

    console.log('🔑 Final file key:', finalFileKey);

    // Get PDF buffer (from Backblaze B2 or local file for testing)
    let pdfBuffer;
    
    // Check if this is a local file path for testing
    if (filePath && filePath.startsWith('/temp/')) {
      console.log('📁 Loading local file for testing:', filePath);
      try {
        const localPath = path.join(process.cwd(), filePath.substring(1)); // Remove leading slash
        console.log('📂 Local file path:', localPath);
        pdfBuffer = fs.readFileSync(localPath);
        console.log('✅ Local PDF loaded successfully, size:', pdfBuffer.length, 'bytes');
      } catch (localError) {
        console.error('❌ Failed to load local PDF:', localError);
        throw new Error(`Failed to load local PDF: ${localError.message}`);
      }
    } else {
      // Download from Backblaze B2
      console.log('📥 Downloading PDF from Backblaze B2...');
      try {
        pdfBuffer = await backblazeService.getFileBuffer(finalFileKey);
        console.log('✅ PDF downloaded successfully, size:', pdfBuffer.length, 'bytes');
      } catch (downloadError) {
        console.error('❌ Failed to download PDF:', downloadError);
        throw new Error(`Failed to download PDF: ${downloadError.message}`);
      }
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty');
    }

    // Extract text from PDF using Google Gemini AI Document Understanding
    console.log('🤖 Using Google Gemini AI for PDF text extraction...');
    
    try {
      // Initialize Google Gemini AI
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      // Convert PDF buffer to base64
      const pdfBase64 = pdfBuffer.toString('base64');
      console.log('📄 PDF converted to base64, size:', pdfBase64.length, 'characters');

      // Create the content array for Gemini AI
      const contents = [
        {
          text: `Please extract all the text content from this PDF document. 
          
          Instructions:
          - Extract ALL text content from every page
          - Maintain the logical structure and flow of the document
          - Preserve paragraph breaks and section divisions
          - Include headings, subheadings, and body text
          - Do not add any commentary, analysis, or interpretation
          - Return only the extracted text content
          - If the document contains tables, extract the text content from them as well
          - Preserve the reading order of the content
          
          Please provide the complete text extraction:`
        },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64
          }
        }
      ];

      console.log('🔍 Sending PDF to Gemini AI for text extraction...');
      
      // Generate content using Gemini AI
      const result = await model.generateContent(contents);
      const response = await result.response;
      const extractedText = response.text();

      console.log('✅ Gemini AI text extraction successful');
      console.log('📝 Extracted text length:', extractedText.length, 'characters');

      // Clean up the extracted text
      const cleanedText = extractedText
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();

      console.log('🔍 PDF Text Analysis:');
      console.log('📝 Raw text length:', extractedText.length);
      console.log('🧹 Cleaned text length:', cleanedText.length);
      console.log('📄 First 200 chars:', cleanedText.substring(0, 200));
      console.log('📊 Word count:', cleanedText.split(/\s+/).length);
      
      // Check if text seems meaningful (not just garbled characters)
      const meaningfulTextRatio = (cleanedText.match(/[a-zA-Z\s]/g) || []).length / cleanedText.length;
      console.log('📈 Meaningful text ratio:', meaningfulTextRatio);

      // Validate that we got meaningful content
      if (cleanedText.length < 50) {
        throw new Error('Extracted text is too short - PDF may be empty or contain only images');
      }

      if (meaningfulTextRatio < 0.7) {
        throw new Error('Extracted text appears to be garbled or corrupted');
      }

      return NextResponse.json({
        success: true,
        content: {
          rawText: cleanedText,
          pageCount: 'Extracted via AI',
          wordCount: cleanedText.split(/\s+/).length,
          characterCount: cleanedText.length,
          meaningfulTextRatio: meaningfulTextRatio,
          extractionMethod: 'Gemini AI Document Understanding'
        },
        message: 'PDF text extracted successfully using AI document understanding'
      });

    } catch (geminiError) {
      console.error('❌ Gemini AI PDF extraction failed:', geminiError);
      
      // Check for specific Gemini AI errors
      if (geminiError.message && geminiError.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Google AI quota exceeded. Please try again later or upgrade your API plan.');
      }
      
      if (geminiError.message && geminiError.message.includes('SAFETY')) {
        throw new Error('PDF content was blocked by safety filters. Please ensure the document contains appropriate content.');
      }
      
      if (geminiError.message && geminiError.message.includes('FILE_TOO_LARGE')) {
        throw new Error('PDF file is too large for AI processing. Please try with a smaller file or split the document.');
      }

      // Fallback: Try basic pdf-parse as last resort
      console.log('🔄 Falling back to basic PDF parsing...');
      
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(pdfBuffer);
        const fallbackText = pdfData.text;
        
        if (fallbackText && fallbackText.trim().length > 50) {
          console.log('✅ Fallback PDF parsing successful');
          
          const cleanedFallbackText = fallbackText
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();

          const meaningfulRatio = (cleanedFallbackText.match(/[a-zA-Z\s]/g) || []).length / cleanedFallbackText.length;
          
          if (meaningfulRatio > 0.7) {
            return NextResponse.json({
              success: true,
              content: {
                rawText: cleanedFallbackText,
                pageCount: pdfData.numpages,
                wordCount: cleanedFallbackText.split(/\s+/).length,
                characterCount: cleanedFallbackText.length,
                meaningfulTextRatio: meaningfulRatio,
                extractionMethod: 'Fallback PDF Parse'
              },
              message: 'PDF text extracted using fallback method'
            });
          }
        }
        
        throw new Error('Fallback extraction also produced poor quality text');
        
      } catch (fallbackError) {
        console.error('❌ Fallback PDF parsing also failed:', fallbackError);
        throw new Error(`PDF text extraction failed with both AI and traditional methods. Original error: ${geminiError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract text from PDF',
        details: error.message 
      },
      { status: 500 }
    );
  }
}