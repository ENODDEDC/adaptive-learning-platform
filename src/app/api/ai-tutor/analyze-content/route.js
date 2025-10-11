import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length < 50) {
      return NextResponse.json({ 
        isEducational: false, 
        reason: 'Content too short to analyze' 
      });
    }

    // Initialize Gemini AI (same as your existing AI Narrator service)
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Truncate content if too long (Gemini has token limits)
    const maxLength = 4000; // Conservative limit for Gemini
    const truncatedContent = content.length > maxLength 
      ? content.substring(0, maxLength) + "..."
      : content;

    const prompt = `
You are an AI content analyzer. Your task is to determine if the given document content is educational/learning material that would be suitable for AI narration.

Educational content includes:
- Lessons, tutorials, or instructional materials
- Academic subjects (math, science, history, literature, etc.)
- Study materials, textbooks, or course content
- Explanatory content that teaches concepts
- Research papers or academic articles
- Training materials or how-to guides
- Educational exercises or examples

Non-educational content includes:
- Administrative announcements or memos
- Schedules, calendars, or event listings
- Policy documents or procedures
- Forms, applications, or certificates
- Personal letters or informal communications
- News updates or notifications
- Business documents (invoices, receipts, etc.)
- Meeting minutes or agendas

Analyze the following document content and determine if it's educational material suitable for AI narration:

DOCUMENT CONTENT:
${truncatedContent}

Respond with ONLY a JSON object containing:
{
  "isEducational": boolean,
  "confidence": number (0-1),
  "reasoning": "Brief explanation of your decision",
  "contentType": "Brief description of what type of content this is"
}

Be strict in your analysis - only classify content as educational if it genuinely contains learning material that students could benefit from AI narration assistance.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text().trim();
    
    // Parse the AI response
    let analysisResult;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        analysisResult = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('❌ Error parsing Gemini AI response:', parseError);
      console.error('Raw response:', aiResponse);
      
      // Fallback analysis if AI response is malformed
      return NextResponse.json({ 
        isEducational: false, 
        reason: 'Unable to analyze content properly - AI response parsing failed',
        confidence: 0,
        contentType: 'Unknown',
        analysis: {
          aiAnalysis: false,
          parseError: true,
          rawResponse: aiResponse.substring(0, 200)
        }
      });
    }

    console.log('🤖 Gemini AI Content Analysis Results:', {
      isEducational: analysisResult.isEducational,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      contentType: analysisResult.contentType,
      contentLength: content.length,
      firstChars: content.substring(0, 100) + '...',
      wordCount: content.split(/\s+/).length
    });

    return NextResponse.json({
      isEducational: analysisResult.isEducational,
      confidence: analysisResult.confidence || 0.5,
      reasoning: analysisResult.reasoning || 'Analysis completed',
      contentType: analysisResult.contentType || 'Unknown',
      analysis: {
        aiAnalysis: true,
        model: 'gemini-flash-latest',
        contentLength: content.length,
        truncated: content.length > maxLength
      }
    });

  } catch (error) {
    console.error('❌ Error in Gemini AI content analysis:', error);
    
    // If Gemini AI fails, fall back to a simple heuristic
    const content_lower = content.toLowerCase();
    const hasEducationalTerms = /\b(learn|study|understand|concept|theory|lesson|tutorial|chapter|example|exercise|definition|explanation)\b/i.test(content);
    const hasAdminTerms = /\b(announcement|memo|schedule|meeting|policy|form|application|notice|reminder)\b/i.test(content);
    
    const fallbackResult = hasEducationalTerms && !hasAdminTerms;
    
    return NextResponse.json({
      isEducational: fallbackResult,
      confidence: 0.3, // Lower confidence for fallback
      reasoning: 'Fallback analysis due to Gemini AI service unavailability',
      contentType: 'Unknown - analyzed with basic heuristics',
      analysis: {
        aiAnalysis: false,
        fallback: true,
        error: error.message
      }
    });
  }
}