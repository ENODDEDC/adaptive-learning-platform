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

    console.log('🤖 Generating AI study tips...');
    const tips = await aiTutorService.generateStudyTips(docxText);

    return NextResponse.json({
      success: true,
      tips
    });

  } catch (error) {
    console.error('❌ Error generating study tips:', error);
    return NextResponse.json(
      { error: 'Failed to generate study tips' },
      { status: 500 }
    );
  }
}