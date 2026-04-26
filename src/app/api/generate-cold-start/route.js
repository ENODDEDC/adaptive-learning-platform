import { NextResponse } from 'next/server';
import { GroqGenAI } from '@/lib/groqGenAI';
import Content from '@/models/Content';
import connectToDatabase from '@/lib/mongodb';

/**
 * Validates and fixes common Mermaid diagram syntax errors
 * Prevents rendering failures in the UI
 */
function validateAndFixMermaidDiagram(diagramCode) {
  if (!diagramCode || typeof diagramCode !== 'string') {
    return diagramCode;
  }

  let fixed = diagramCode;

  // Fix 1: Remove parentheses from node labels (common AI mistake)
  // Example: A[First Normal Form (1NF)] → A[First Normal Form - 1NF]
  fixed = fixed.replace(/\[([^\]]*)\(([^)]*)\)([^\]]*)\]/g, '[$1- $2$3]');

  // Fix 2: Remove numbers from node IDs (only letters allowed)
  // Example: A1[Something] → A[Something]
  fixed = fixed.replace(/\b([A-Z])\d+\[/g, '$1[');

  // Fix 3: Truncate long labels (max 50 chars)
  fixed = fixed.replace(/\[([^\]]{50,})\]/g, (match, label) => {
    return `[${label.substring(0, 47)}...]`;
  });

  // Fix 4: Remove special characters that break Mermaid
  // Keep only: letters, numbers, spaces, dashes, underscores
  fixed = fixed.replace(/\[([^\]]+)\]/g, (match, label) => {
    const cleaned = label.replace(/[^a-zA-Z0-9\s\-_]/g, ' ').replace(/\s+/g, ' ').trim();
    return `[${cleaned}]`;
  });

  // Fix 5: Ensure proper flowchart syntax
  if (!fixed.includes('flowchart') && !fixed.includes('graph')) {
    fixed = 'flowchart TD\n' + fixed;
  }

  console.log('🔧 Diagram validation:', {
    hadParentheses: diagramCode.includes('(') && diagramCode.includes(')'),
    hadNumbers: /[A-Z]\d+\[/.test(diagramCode),
    wasFixed: fixed !== diagramCode
  });

  return fixed;
}

const MODE_PROMPTS = {
  'Global Learning': `Give a big-picture overview. Format your response EXACTLY like this:

🌐 BIG PICTURE
[2-3 sentence summary of the whole topic]

🔑 KEY CONCEPTS
• [concept 1]: [brief explanation]
• [concept 2]: [brief explanation]
• [concept 3]: [brief explanation]

🔗 HOW THEY CONNECT
[1-2 sentences on how the concepts relate]

Keep it concise. Max 250 words.`,

  'Sequential Learning': `Break this into steps. Format EXACTLY like this:

📋 STEP-BY-STEP BREAKDOWN

Step 1: [title]
[brief explanation]

Step 2: [title]
[brief explanation]

Step 3: [title]
[brief explanation]

Step 4: [title]
[brief explanation]

Max 250 words.`,

  'Visual Learning': `Generate a Mermaid.js flowchart AND descriptions. Output EXACTLY in this format, nothing else:

DIAGRAM:
flowchart TD
    A[Main Topic] --> B[Concept 1]
    A --> C[Concept 2]
    B --> D[Detail 1]
    C --> E[Detail 2]

DESCRIPTIONS:
A: [one sentence what Main Topic means]
B: [one sentence what Concept 1 means]
C: [one sentence what Concept 2 means]
D: [one sentence what Detail 1 means]
E: [one sentence what Detail 2 means]

CRITICAL RULES FOR MERMAID SYNTAX:
- Node labels MUST be SHORT (max 4 words, no parentheses)
- Use ONLY letters A-Z for node IDs (no numbers, no special chars)
- NO parentheses () in node labels - use dashes or commas instead
- NO special characters in labels except spaces and dashes
- Keep it simple: max 8 nodes total
- Each description max 15 words

EXAMPLE OF GOOD LABELS:
✓ A[Database Design]
✓ B[First Normal Form]
✓ C[Remove Duplicates]

EXAMPLE OF BAD LABELS (DO NOT USE):
✗ A[First Normal Form (1NF)]  ← NO PARENTHESES
✗ A[This is a very long label with too many words]  ← TOO LONG
✗ A1[Something]  ← NO NUMBERS IN NODE IDS`,

  'Hands-On Lab': `Create practical examples and exercises. Format EXACTLY like this:

🔬 HANDS-ON EXAMPLES

💡 Real-World Example 1:
[concrete example from daily life]

💡 Real-World Example 2:
[another practical application]

🛠️ Try This Exercise:
[simple hands-on activity they can do]

📊 Practice Scenario:
[realistic situation to apply the concept]

Max 250 words.`,

  'Concept Constellation': `Identify patterns and theoretical frameworks. Format EXACTLY like this:

🌟 PATTERN RECOGNITION

🔍 Pattern 1:
[underlying pattern or principle]

🔍 Pattern 2:
[another recurring theme]

🧠 Theoretical Framework:
[academic or conceptual model that applies]

🔗 Hidden Connections:
[surprising relationships between ideas]

Max 250 words.`,

  'Active Learning Hub': `Create practice challenges. Format EXACTLY like this:

🎯 PRACTICE CHALLENGES

❓ Question 1:
[short question]

❓ Question 2:
[short question]

❓ Question 3:
[short question]

💡 Quick Challenge:
[one hands-on mini task]

Max 250 words.`,

  'Reflective Learning': `Create reflection prompts. Format EXACTLY like this:

🤔 REFLECT & THINK DEEPER

💭 Prompt 1:
[deep reflection question]

💭 Prompt 2:
[deep reflection question]

💭 Prompt 3:
[connection to real life]

✍️ Journal Starter:
[sentence starter for journaling]

Max 250 words.`,
};

export async function POST(request) {
  try {
    const { content, mode, title, contentId } = await request.json();

    if (!content || !mode) {
      return NextResponse.json({ error: 'Missing content or mode' }, { status: 400 });
    }

    // 1. Check database cache if contentId is provided
    if (contentId) {
      await connectToDatabase();
      const contentDoc = await Content.findById(contentId);
      
      let cachedContent = null;
      if (contentDoc?.coldStartCache) {
        if (typeof contentDoc.coldStartCache.get === 'function') {
          cachedContent = contentDoc.coldStartCache.get(mode);
        } else {
          cachedContent = contentDoc.coldStartCache[mode];
        }
      }

      if (cachedContent) {
        console.log(`🚀 [CACHE HIT] Found ${mode} in Database for ${contentId}`);
        
        // Validate and fix diagram if it's Visual Learning mode
        if (mode === 'Visual Learning') {
          const diagramMatch = cachedContent.match(/DIAGRAM:\s*([\s\S]*?)(?=DESCRIPTIONS:|$)/);
          if (diagramMatch) {
            const originalDiagram = diagramMatch[1].trim();
            const fixedDiagram = validateAndFixMermaidDiagram(originalDiagram);
            if (fixedDiagram !== originalDiagram) {
              cachedContent = cachedContent.replace(originalDiagram, fixedDiagram);
              console.log('🔧 Fixed cached diagram syntax');
            }
          }
        }
        
        return NextResponse.json({ 
          content: cachedContent,
          isCached: true 
        });
      }
      console.log(`🔍 [CACHE MISS] No ${mode} in Database for ${contentId}`);
    }

    const prompt = MODE_PROMPTS[mode] || MODE_PROMPTS['Global Learning'];
    const truncatedContent = content.slice(0, 3000);

    const genAI = new GroqGenAI();
    const model = genAI.getGenerativeModel({ model: 'llama3.1-8b' });
    const result = await model.generateContent(
      `You are an adaptive learning assistant. Based on the following document content, ${prompt}\n\nDocument Title: ${title || 'Untitled'}\n\nContent:\n${truncatedContent}`
    );
    const response = await result.response;
    let text = response.text();

    // Validate and fix diagram if it's Visual Learning mode
    if (mode === 'Visual Learning') {
      const diagramMatch = text.match(/DIAGRAM:\s*([\s\S]*?)(?=DESCRIPTIONS:|$)/);
      if (diagramMatch) {
        const originalDiagram = diagramMatch[1].trim();
        const fixedDiagram = validateAndFixMermaidDiagram(originalDiagram);
        if (fixedDiagram !== originalDiagram) {
          text = text.replace(originalDiagram, fixedDiagram);
          console.log('🔧 Fixed generated diagram syntax');
        }
      }
    }

    // 2. Save to database cache if contentId is provided
    if (contentId) {
      try {
        await Content.findByIdAndUpdate(contentId, {
          $set: { [`coldStartCache.${mode}`]: text }
        });
        console.log(`💾 Saved generated ${mode} to Database cache.`);
      } catch (dbError) {
        console.error('Failed to save cold start cache to DB:', dbError);
      }
    }

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('Cold start generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
