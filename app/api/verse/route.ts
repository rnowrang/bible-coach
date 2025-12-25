import { NextResponse } from 'next/server';
import { BibleAPIClient } from '@/lib/bible-api';

// Book ID to full name mapping
const BOOK_NAMES: Record<string, string> = {
  'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers', 'DEU': 'Deuteronomy',
  'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth', '1SA': '1 Samuel', '2SA': '2 Samuel',
  '1KI': '1 Kings', '2KI': '2 Kings', '1CH': '1 Chronicles', '2CH': '2 Chronicles',
  'EZR': 'Ezra', 'NEH': 'Nehemiah', 'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms',
  'PRO': 'Proverbs', 'ECC': 'Ecclesiastes', 'SNG': 'Song of Solomon', 'ISA': 'Isaiah',
  'JER': 'Jeremiah', 'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel',
  'HOS': 'Hosea', 'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
  'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah', 'HAG': 'Haggai',
  'ZEC': 'Zechariah', 'MAL': 'Malachi', 'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke',
  'JHN': 'John', 'ACT': 'Acts', 'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
  'GAL': 'Galatians', 'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians',
  '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy',
  'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James', '1PE': '1 Peter',
  '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John', '3JN': '3 John', 'JUD': 'Jude',
  'REV': 'Revelation',
};

// Fallback: Fetch verse from free bible-api.com (no API key required)
async function fetchFromFreeBibleApi(bookName: string, chapter: string, verse: string): Promise<{ text: string; reference: string } | null> {
  try {
    const query = encodeURIComponent(`${bookName} ${chapter}:${verse}`);
    const response = await fetch(`https://bible-api.com/${query}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.text) {
      const cleanText = data.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        text: cleanText,
        reference: data.reference || `${bookName} ${chapter}:${verse}`,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching from bible-api.com:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bibleId = searchParams.get('bibleId');
    const verseId = searchParams.get('verseId');
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');
    const verse = searchParams.get('verse');

    if (!book || !chapter || !verse) {
      return NextResponse.json(
        { error: 'book, chapter, and verse are required' },
        { status: 400 }
      );
    }

    const bookName = BOOK_NAMES[book] || book;
    const constructedVerseId = verseId || `${book}.${chapter}.${verse}`;
    
    // Try API.Bible first if key is configured
    const apiKey = process.env.API_BIBLE_KEY;
    if (apiKey && apiKey !== 'your_api_bible_key_here') {
      try {
        const client = new BibleAPIClient(apiKey);
        
        // Use provided bibleId or default to a common one
        const targetBibleId = bibleId || '9879dbb7cfe39e4d-01'; // Default: World English Bible
        const verseData = await client.getVerse(targetBibleId, constructedVerseId);
        
        if (verseData) {
          console.log(`✅ Fetched from API.Bible: ${verseData.reference}`);
          return NextResponse.json({ verse: verseData });
        }
      } catch (apiError: any) {
        console.warn('API.Bible error, trying fallback:', apiError.message);
      }
    }
    
    // Fallback to free bible-api.com
    console.log(`Fetching from fallback API: ${bookName} ${chapter}:${verse}`);
    const fallbackResult = await fetchFromFreeBibleApi(bookName, chapter, verse);
    
    if (fallbackResult) {
      return NextResponse.json({
        verse: {
          reference: fallbackResult.reference,
          text: fallbackResult.text,
          translation: 'World English Bible',
        },
      });
    }

    return NextResponse.json(
      { 
        error: 'Verse not found',
        message: `Could not fetch ${bookName} ${chapter}:${verse}`,
      },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching verse:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch verse' },
      { status: 500 }
    );
  }
}
