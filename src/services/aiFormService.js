import { GroqGenAI as GoogleGenerativeAI, resolveGroqContentModel } from '@/lib/groqGenAI';

class AIFormService {
  constructor() {
    // Uses Cerebras/Groq via the drop-in GroqGenAI wrapper
    this.genAI = new GoogleGenerativeAI();
  }

  /**
   * Parse document text into a structured JSON array of form questions
   */
  async parseDocumentToQuestions(text) {
    try {
      const modelName = resolveGroqContentModel();
      const model = this.genAI.getGenerativeModel({ model: modelName });

      const prompt = `
You are an expert educator and assessment designer. Your task is to analyze the provided text and extract educational questions to create a digital form or quiz.

### Input Text:
${text.substring(0, 10000)} // Truncate to avoid token limits

### Instructions:
1. Identify all clear questions and their corresponding options/answers.
2. For each question, determine the most appropriate question type:
   - "multiple_choice": If there are single-select options.
   - "checkboxes": If there are multiple-select options.
   - "short_answer": If it's a simple open-ended question.
   - "paragraph": If it's a long-form open-ended question.
   - "true_false": Treat as multiple_choice with "True" and "False" options.
3. Extract the correct answer if provided in the text.
4. Ignore headers like "Set A", "Test I", "Posttest" etc., or use them to better understand the context, but do not include them as question text.
5. Assign a default point value (usually 1).
6. Ensure the output is a valid JSON array of question objects.

### Output Format (JSON Array):
[
  {
    "type": "multiple_choice",
    "title": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "correctAnswer": "Paris",
    "points": 1,
    "required": true
  },
  {
    "type": "short_answer",
    "title": "Explain the process of photosynthesis.",
    "correctAnswer": "",
    "points": 5,
    "required": true
  }
]

### Constraints:
- Respond with ONLY the JSON array.
- Do not include any markdown formatting (like \`\`\`json).
- If no questions are found, return an empty array [].
- If a question has "A, B, C, D" style options, clean them up (remove the "A) " prefix).

Analyze the text and generate the JSON now.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let aiResponse = response.text().trim();

      // Clean up markdown if AI includes it
      if (aiResponse.startsWith('```')) {
        aiResponse = aiResponse.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      try {
        const questions = JSON.parse(aiResponse);
        return Array.isArray(questions) ? questions : [];
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', aiResponse);
        throw new Error('AI generated an invalid response format.');
      }
    } catch (error) {
      console.error('Error in AIFormService:', error);
      throw error;
    }
  }
}

export const aiFormService = new AIFormService();
