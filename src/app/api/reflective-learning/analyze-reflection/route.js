import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { reflection, prompt, context } = await request.json();

        if (!reflection) {
            return NextResponse.json(
                { error: 'Reflection content is required' },
                { status: 400 }
            );
        }

        // Mock reflection analysis - in production, this would use AI/NLP
        const wordCount = reflection.split(' ').length;
        const sentenceCount = reflection.split(/[.!?]+/).length - 1;
        const avgWordsPerSentence = wordCount / Math.max(sentenceCount, 1);
        
        // Calculate maturation score based on reflection quality indicators
        let maturationScore = 0;
        
        // Length and depth indicators
        if (wordCount > 50) maturationScore += 2;
        if (wordCount > 100) maturationScore += 3;
        if (wordCount > 200) maturationScore += 5;
        
        // Complexity indicators
        if (avgWordsPerSentence > 12) maturationScore += 2;
        if (reflection.includes('because') || reflection.includes('therefore') || reflection.includes('however')) {
            maturationScore += 3;
        }
        
        // Question indicators (shows deeper thinking)
        const questionCount = (reflection.match(/\?/g) || []).length;
        maturationScore += questionCount * 2;
        
        // Connection indicators
        if (reflection.toLowerCase().includes('connect') || 
            reflection.toLowerCase().includes('relate') || 
            reflection.toLowerCase().includes('similar') ||
            reflection.toLowerCase().includes('different')) {
            maturationScore += 4;
        }
        
        // Personal insight indicators
        if (reflection.toLowerCase().includes('i think') || 
            reflection.toLowerCase().includes('i believe') || 
            reflection.toLowerCase().includes('in my opinion')) {
            maturationScore += 3;
        }

        // Generate feedback based on analysis
        let feedback = '';
        let reflectionQuality = 'surface';
        
        if (maturationScore >= 15) {
            reflectionQuality = 'deep';
            feedback = 'Excellent reflection! You demonstrate deep thinking with thoughtful analysis, personal insights, and meaningful connections. Your reflection shows sophisticated understanding and critical thinking.';
        } else if (maturationScore >= 8) {
            reflectionQuality = 'moderate';
            feedback = 'Good reflection! You show solid thinking with some analysis and personal insights. Consider exploring connections to other concepts or asking deeper questions to enhance your reflection.';
        } else {
            reflectionQuality = 'surface';
            feedback = 'Your reflection is a good start! To deepen your thinking, try asking "why" and "how" questions, making connections to other ideas, or exploring different perspectives on the topic.';
        }

        // Provide specific suggestions based on the reflection
        const suggestions = [];
        
        if (questionCount === 0) {
            suggestions.push('Try asking questions about the material to deepen your understanding');
        }
        
        if (wordCount < 50) {
            suggestions.push('Consider expanding your thoughts with more detailed explanations');
        }
        
        if (!reflection.toLowerCase().includes('connect') && !reflection.toLowerCase().includes('relate')) {
            suggestions.push('Think about how this content connects to other concepts or your prior knowledge');
        }
        
        if (avgWordsPerSentence < 8) {
            suggestions.push('Try developing more complex thoughts with detailed reasoning');
        }

        return NextResponse.json({
            success: true,
            maturationScore: maturationScore,
            reflectionQuality: reflectionQuality,
            feedback: feedback,
            suggestions: suggestions,
            analytics: {
                wordCount: wordCount,
                sentenceCount: sentenceCount,
                avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
                questionCount: questionCount,
                complexityIndicators: avgWordsPerSentence > 12,
                connectionIndicators: reflection.toLowerCase().includes('connect') || reflection.toLowerCase().includes('relate'),
                personalInsightIndicators: reflection.toLowerCase().includes('i think') || reflection.toLowerCase().includes('i believe')
            },
            analyzedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error analyzing reflection:', error);
        return NextResponse.json(
            { error: 'Failed to analyze reflection' },
            { status: 500 }
        );
    }
}