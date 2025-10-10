import { NextResponse } from 'next/server';
import aiTutorService from '@/services/aiTutorService';

export async function POST(request) {
  try {
    const { docxText } = await request.json();

    if (!docxText) {
      return NextResponse.json(
        { error: 'DOCX text content is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Generating AI summary...');
    const summary = await aiTutorService.generateSummary(docxText);

    return NextResponse.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}