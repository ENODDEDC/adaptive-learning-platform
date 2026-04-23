import { NextResponse } from 'next/server';
import { aiFormService } from '@/services/aiFormService';
import mammoth from 'mammoth';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      // Extract from PDF
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (fileName.endsWith('.docx')) {
      // Extract from DOCX
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith('.txt')) {
      // Extract from TXT
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ error: 'Could not extract text from the document' }, { status: 400 });
    }

    // Call AI service to parse text into questions
    const questions = await aiFormService.parseDocumentToQuestions(extractedText);

    return NextResponse.json({ 
      success: true, 
      questions,
      count: questions.length 
    });

  } catch (error) {
    console.error('Error in parse-document API:', error);
    return NextResponse.json({ 
      error: 'Failed to process document', 
      details: error.message 
    }, { status: 500 });
  }
}
