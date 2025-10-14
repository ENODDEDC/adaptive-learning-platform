import { NextResponse } from 'next/server';
import aiTutorService from '@/services/aiTutorService';

export async function POST(request) {
  try {
    const { docxText, numQuestions = 5 } = await request.json();

    if (!docxText) {
      return NextResponse.json(
        { error: 'DOCX text content is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Generating AI quiz questions...');
    const questions = await aiTutorService.generateQuestions(docxText, numQuestions);

    return NextResponse.json({
      success: true,
      questions
    });

  } catch (error) {
    console.error('❌ Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
}