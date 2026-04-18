import { NextResponse } from 'next/server';
import reflectiveLearningService from '@/services/reflectiveLearningService';

export async function POST(request) {
  try {
    const { content, fileName } = await request.json();

    if (!content || !String(content).trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const reflective = await reflectiveLearningService.generateReflectiveContent(content, fileName || 'document');

    return NextResponse.json({
      success: true,
      ...reflective,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('reflective-learning/generate', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate reflective content' },
      { status: 500 }
    );
  }
}
