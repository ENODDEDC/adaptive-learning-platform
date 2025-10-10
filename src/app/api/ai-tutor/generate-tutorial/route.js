import { NextResponse } from 'next/server';
import aiTutorService from '@/services/aiTutorService';

export async function POST(request) {
  try {
    const { docxText, studentLevel = 'intermediate', mode = 'complete' } = await request.json();

    if (!docxText) {
      return NextResponse.json(
        { error: 'DOCX text content is required' },
        { status: 400 }
      );
    }

    console.log(`🤖 Generating AI tutorial content in ${mode} mode...`);
    
    let content;
    switch (mode) {
      case 'quick_overview':
        content = await aiTutorService.generateQuickOverview(docxText, studentLevel);
        break;
      case 'key_concepts':
        content = await aiTutorService.generateKeyConcepts(docxText, studentLevel);
        break;
      case 'complete':
      default:
        content = await aiTutorService.generateTutorialContent(docxText, studentLevel);
        break;
    }

    return NextResponse.json({
      success: true,
      content,
      mode
    });

  } catch (error) {
    console.error('❌ Error generating tutorial:', error);
    return NextResponse.json(
      { error: 'Failed to generate tutorial content' },
      { status: 500 }
    );
  }
}