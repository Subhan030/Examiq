import { Request, Response } from 'express';
import OpenAI from 'openai';

const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

export const generateQuestions = async (req: Request, res: Response) => {
  try {
    const { topic, count = 5, difficulty = 'Medium' } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.status(500).json({ message: 'Groq API key not configured. Please set GROQ_API_KEY in backend/.env' });
    }

    const prompt = `Generate exactly ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array with no extra text. Each object must have exactly this structure:
[
  {
    "type": "MCQ",
    "category": "${topic}",
    "difficulty": "${difficulty}",
    "content": "The question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0
  }
]

Rules:
- correctOptionIndex is 0-based (0 for first option, 1 for second, etc.)
- Each question must have exactly 4 options
- Questions should be educational and accurate
- Return ONLY the JSON array, no markdown, no explanation`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are a professional exam question generator. You output ONLY valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from potential markdown code blocks
    let jsonStr = raw.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const questions = JSON.parse(jsonStr);

    if (!Array.isArray(questions)) {
      return res.status(500).json({ message: 'AI returned invalid format. Please try again.' });
    }

    // Validate and sanitize each question
    const validated = questions.map((q: any) => ({
      type: 'MCQ',
      category: q.category || topic,
      difficulty: q.difficulty || difficulty,
      content: q.content || '',
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['', '', '', ''],
      correctOptionIndex: typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0
    }));

    res.json(validated);
  } catch (error: any) {
    console.error('AI Generation Error:', error.message);
    if (error.message?.includes('JSON')) {
      return res.status(500).json({ message: 'AI returned malformed response. Please try again.' });
    }
    res.status(500).json({ message: error.message || 'AI generation failed' });
  }
};
