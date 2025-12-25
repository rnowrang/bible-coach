// Bible API client using API.Bible
// Documentation: https://api.bible/

const API_BIBLE_BASE_URL = 'https://rest.api.bible/v1';

export interface Bible {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
}

export interface Verse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  content: string;
  verseCount: number;
  copyright: string;
  next?: {
    id: string;
    bookId: string;
  };
  previous?: {
    id: string;
    bookId: string;
  };
}

export interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

export class BibleAPIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchAPI(endpoint: string): Promise<any> {
    const response = await fetch(`${API_BIBLE_BASE_URL}${endpoint}`, {
      headers: {
        'api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Bible API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getBibles(): Promise<Bible[]> {
    const data = await this.fetchAPI('/bibles');
    return data.data || [];
  }

  async getVerse(
    bibleId: string,
    verseId: string
  ): Promise<BibleVerse | null> {
    try {
      const data = await this.fetchAPI(`/bibles/${bibleId}/verses/${verseId}`);
      
      if (!data.data || !data.data.content) {
        return null;
      }

      // Clean HTML tags from content
      let text = data.data.content
        .replace(/<[^>]*>/g, '')  // Remove HTML tags
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
      
      // The API often includes section headings and cross-references before the actual verse
      // Look for a verse number followed immediately by a capital letter (e.g., "1In", "6Then")
      // This indicates where the actual verse content starts
      const verseStartMatch = text.match(/\)?\s*(\d+)([A-Z][a-z])/);
      if (verseStartMatch) {
        // Find where this pattern occurs and take everything after the number
        const matchIndex = text.indexOf(verseStartMatch[0]);
        const numberLength = verseStartMatch[1].length;
        // Skip the closing paren (if any), any whitespace, and the verse number
        let startIndex = matchIndex;
        if (text[matchIndex] === ')') startIndex++;
        while (text[startIndex] === ' ') startIndex++;
        startIndex += numberLength; // Skip the verse number
        text = text.substring(startIndex);
        console.log('Cleaned verse text, starts with:', text.substring(0, 40) + '...');
      }
      
      // Final cleanup - remove any remaining leading verse numbers
      text = text.replace(/^\d+\s*/, '');
      text = text.trim();

      return {
        reference: data.data.reference || verseId,
        text: text,
        translation: data.data.bibleId || bibleId,
      };
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  // Helper to construct verse ID from book, chapter, verse
  // Format: bookId.chapterId.verseId (e.g., "GEN.1.1")
  static constructVerseId(book: string, chapter: number, verse: number): string {
    return `${book}.${chapter}.${verse}`;
  }
}

// Bible books data
export const BIBLE_BOOKS = [
  { id: 'GEN', name: 'Genesis', chapters: 50 },
  { id: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', chapters: 27 },
  { id: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { id: 'JOS', name: 'Joshua', chapters: 24 },
  { id: 'JDG', name: 'Judges', chapters: 21 },
  { id: 'RUT', name: 'Ruth', chapters: 4 },
  { id: '1SA', name: '1 Samuel', chapters: 31 },
  { id: '2SA', name: '2 Samuel', chapters: 24 },
  { id: '1KI', name: '1 Kings', chapters: 22 },
  { id: '2KI', name: '2 Kings', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', chapters: 36 },
  { id: 'EZR', name: 'Ezra', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', chapters: 13 },
  { id: 'EST', name: 'Esther', chapters: 10 },
  { id: 'JOB', name: 'Job', chapters: 42 },
  { id: 'PSA', name: 'Psalms', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { id: 'SNG', name: 'Song of Songs', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', chapters: 48 },
  { id: 'DAN', name: 'Daniel', chapters: 12 },
  { id: 'HOS', name: 'Hosea', chapters: 14 },
  { id: 'JOL', name: 'Joel', chapters: 2 },
  { id: 'AMO', name: 'Amos', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', chapters: 1 },
  { id: 'JON', name: 'Jonah', chapters: 4 },
  { id: 'MIC', name: 'Micah', chapters: 7 },
  { id: 'NAM', name: 'Nahum', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { id: 'HAG', name: 'Haggai', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', chapters: 14 },
  { id: 'MAL', name: 'Malachi', chapters: 4 },
  { id: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 'MRK', name: 'Mark', chapters: 16 },
  { id: 'LUK', name: 'Luke', chapters: 24 },
  { id: 'JHN', name: 'John', chapters: 21 },
  { id: 'ACT', name: 'Acts', chapters: 28 },
  { id: 'ROM', name: 'Romans', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', chapters: 13 },
  { id: 'GAL', name: 'Galatians', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', chapters: 6 },
  { id: 'PHP', name: 'Philippians', chapters: 4 },
  { id: 'COL', name: 'Colossians', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', chapters: 3 },
  { id: '1TI', name: '1 Timothy', chapters: 6 },
  { id: '2TI', name: '2 Timothy', chapters: 4 },
  { id: 'TIT', name: 'Titus', chapters: 3 },
  { id: 'PHM', name: 'Philemon', chapters: 1 },
  { id: 'HEB', name: 'Hebrews', chapters: 13 },
  { id: 'JAS', name: 'James', chapters: 5 },
  { id: '1PE', name: '1 Peter', chapters: 5 },
  { id: '2PE', name: '2 Peter', chapters: 3 },
  { id: '1JN', name: '1 John', chapters: 5 },
  { id: '2JN', name: '2 John', chapters: 1 },
  { id: '3JN', name: '3 John', chapters: 1 },
  { id: 'JUD', name: 'Jude', chapters: 1 },
  { id: 'REV', name: 'Revelation', chapters: 22 },
];


