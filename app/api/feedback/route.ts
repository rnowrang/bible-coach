import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Simple fallback feedback generator (works without OpenAI)
function generateSimpleFeedback(verseText: string, userRecitation: string): any {
  const verseWords = verseText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const userWords = userRecitation.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  let correctWords = 0;
  const mistakes: any[] = [];
  
  // Simple word-by-word comparison
  for (let i = 0; i < Math.max(verseWords.length, userWords.length); i++) {
    const verseWord = verseWords[i]?.replace(/[.,!?;:]/g, '');
    const userWord = userWords[i]?.replace(/[.,!?;:]/g, '');
    
    if (!verseWord && userWord) {
      mistakes.push({ type: 'added', word: userWord, position: i });
    } else if (verseWord && !userWord) {
      mistakes.push({ type: 'missing', word: verseWord, position: i });
    } else if (verseWord && userWord && verseWord !== userWord) {
      mistakes.push({ type: 'wrong', word: userWord, position: i });
    } else if (verseWord === userWord) {
      correctWords++;
    }
  }
  
  const accuracy = Math.round((correctWords / verseWords.length) * 100);
  
  let encouragement = '';
  if (accuracy >= 90) {
    encouragement = 'Excellent work! You\'ve memorized this verse very well.';
  } else if (accuracy >= 70) {
    encouragement = 'Great job! You\'re doing well. Keep practicing to perfect it.';
  } else if (accuracy >= 50) {
    encouragement = 'Good effort! You\'re making progress. Review the verse and try again.';
  } else {
    encouragement = 'Keep practicing! Memorization takes time. Review the verse and try again.';
  }
  
  const suggestions = mistakes.length > 0 
    ? `Focus on these areas: ${mistakes.slice(0, 3).map(m => m.word).join(', ')}. Review the verse and practice again.`
    : 'You\'re doing great! Keep practicing to maintain your memory.';
  
  return {
    accuracy: Math.max(0, Math.min(100, accuracy)),
    mistakes: mistakes.slice(0, 10), // Limit to first 10 mistakes
    encouragement,
    suggestions,
  };
}

export async function POST(request: Request) {
  let verseText: string = '';
  let userRecitation: string = '';
  
  try {
    const body = await request.json();
    verseText = body.verseText || '';
    userRecitation = body.userRecitation || '';

    if (!verseText || !userRecitation) {
      return NextResponse.json(
        { error: 'verseText and userRecitation are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `You are a helpful Bible memorization coach. Compare the user's recitation with the correct Bible verse and provide feedback.

Correct Verse: "${verseText}"

User's Recitation: "${userRecitation}"

Please provide:
1. An accuracy score (0-100%)
2. A list of specific mistakes (words that are wrong, missing, or added)
3. An encouraging message
4. Suggestions for improvement

Format your response as JSON with these fields:
- accuracy: number (0-100)
- mistakes: array of objects with {type: "missing"|"wrong"|"added", word: string, position: number}
- encouragement: string
- suggestions: string

Be gentle and encouraging. Focus on what they got right, then help them with what needs work.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful Bible memorization coach. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const feedbackText = completion.choices[0]?.message?.content;
    
    if (!feedbackText) {
      throw new Error('No response from OpenAI');
    }

    const feedback = JSON.parse(feedbackText);

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error('Error generating feedback:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('exceeded')) {
      // Provide simple fallback feedback when quota is exceeded
      if (verseText && userRecitation) {
        const simpleFeedback = generateSimpleFeedback(verseText, userRecitation);
        return NextResponse.json({ 
          feedback: simpleFeedback,
          warning: 'Using simple feedback due to OpenAI quota limit. Add credits at https://platform.openai.com/ for AI-powered coaching.',
          code: 'QUOTA_EXCEEDED'
        });
      }
    }
    
    if (error.status === 401 || error.message?.includes('Invalid API key')) {
      return NextResponse.json(
        { 
          error: 'Invalid OpenAI API key',
          message: 'Please check your OPENAI_API_KEY in the .env file.',
          code: 'INVALID_KEY'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate feedback',
        message: 'Unable to get AI feedback. Please try again later or check your OpenAI API configuration.',
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

