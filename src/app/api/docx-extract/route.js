import { NextResponse } from 'next/server';
import backblazeService from '@/services/backblazeService';
import docxExtractor from '@/services/docxExtractor';

export async function POST(request) {
  try {
    const { fileKey, filePath } = await request.json();

    if (!fileKey && !filePath) {
      return NextResponse.json(
        { error: 'File key or file path is required' },
        { status: 400 }
      );
    }

    console.log('📄 Extracting DOCX content...');

    let docxBuffer;

    // Get DOCX buffer from Backblaze B2 or local file
    if (filePath && filePath.startsWith('/temp/')) {
      // Local file for testing
      const fs = await import('fs');
      const path = await import('path');
      const localPath = path.join(process.cwd(), filePath.substring(1));
      docxBuffer = fs.readFileSync(localPath);
    } else {
      // Download from Backblaze B2
      const finalFileKey = fileKey || filePath.replace('/api/files/', '');
      docxBuffer = await backblazeService.getFileBuffer(finalFileKey);
    }

    if (!docxBuffer || docxBuffer.length === 0) {
      throw new Error('DOCX buffer is empty');
    }

    // Extract enhanced content with better formatting
    const rawText = await docxExtractor.extractText(docxBuffer);
    const enhancedHtml = await docxExtractor.extractHTML(docxBuffer);
    const structuredContent = await docxExtractor.extractStructuredContent(docxBuffer);
    const stats = docxExtractor.getDocumentStats(rawText);

    const extractedContent = {
      rawText: rawText,
      html: enhancedHtml, // Use enhanced HTML with better formatting
      sections: structuredContent.sections
    };

    console.log('✅ DOCX content extracted successfully');
    console.log('📊 Document stats:', stats);

    return NextResponse.json({
      success: true,
      content: extractedContent,
      stats
    });

  } catch (error) {
    console.error('❌ Error extracting DOCX content:', error);
    return NextResponse.json(
      { error: 'Failed to extract DOCX content', details: error.message },
      { status: 500 }
    );
  }
}