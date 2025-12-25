import { NextResponse } from 'next/server';
import { BibleAPIClient } from '@/lib/bible-api';

// Fallback Bible translations if API fails
// Note: Free tier typically has access to public domain translations like WEB, ASV, etc.
// These IDs are examples - actual IDs depend on what's available in the free tier
const FALLBACK_BIBLES = [
  { id: '9879dbb7cfe39e4d-01', name: 'World English Bible', abbreviation: 'WEB', language: 'en' },
  { id: '06125adad2d5898a-01', name: 'English Standard Version', abbreviation: 'ESV', language: 'en' },
  { id: 'de4e12af7f28f599-01', name: 'New International Version', abbreviation: 'NIV', language: 'en' },
  { id: 'de4e12af7f28f599-02', name: 'King James Version', abbreviation: 'KJV', language: 'en' },
];

export async function GET() {
  try {
    const apiKey = process.env.API_BIBLE_KEY;
    
    if (!apiKey || apiKey === 'your_api_bible_key_here') {
      console.warn('API_BIBLE_KEY not configured, using fallback translations');
      return NextResponse.json({ bibles: FALLBACK_BIBLES });
    }

    try {
      const client = new BibleAPIClient(apiKey);
      const bibles = await client.getBibles();
      
      console.log(`📚 Raw API returned ${bibles.length} bibles`);
      
      // Helper to extract language name
      const getLanguageName = (lang: any): string => {
        if (typeof lang === 'string') return lang;
        if (lang && typeof lang === 'object') return lang.name || lang.id || 'Unknown';
        return 'Unknown';
      };
      
      // Helper to check if English
      const isEnglish = (lang: any): boolean => {
        if (typeof lang === 'string') return lang === 'en' || lang === 'eng';
        if (lang && typeof lang === 'object') return lang.id === 'eng' || lang.name === 'English';
        return false;
      };
      
      // Include ALL translations, sorted by language then abbreviation
      const allBibles = bibles
        .map((bible: any) => ({
          id: bible.id,
          name: bible.name || bible.nameLocal,
          abbreviation: bible.abbreviation || bible.abbreviationLocal,
          language: getLanguageName(bible.language),
          isEnglish: isEnglish(bible.language),
        }))
        // Sort: English first, then alphabetically by language, then by abbreviation
        .sort((a: any, b: any) => {
          // English translations first
          if (a.isEnglish && !b.isEnglish) return -1;
          if (!a.isEnglish && b.isEnglish) return 1;
          // Then by language name
          const langCompare = (a.language || '').localeCompare(b.language || '');
          if (langCompare !== 0) return langCompare;
          // Then by abbreviation
          return (a.abbreviation || '').localeCompare(b.abbreviation || '');
        });
      
      // Count by language for logging
      const englishCount = allBibles.filter((b: any) => b.isEnglish).length;
      console.log(`✅ Found ${allBibles.length} total translations (${englishCount} English)`);

      if (allBibles.length > 0) {
        return NextResponse.json({ 
          bibles: allBibles,
          total: allBibles.length,
          englishCount: englishCount
        });
      } else {
        console.warn('No bibles found, using fallback');
        return NextResponse.json({ bibles: FALLBACK_BIBLES });
      }
    } catch (apiError: any) {
      console.error('API.Bible error:', apiError.message);
      // If API fails, use fallback translations
      console.warn('Using fallback translations due to API error');
      return NextResponse.json({ 
        bibles: FALLBACK_BIBLES,
        warning: 'Using fallback translations. Please check your API_BIBLE_KEY in .env file.'
      });
    }
  } catch (error: any) {
    console.error('Error fetching bibles:', error);
    // Return fallback on any error
    return NextResponse.json({ 
      bibles: FALLBACK_BIBLES,
      error: 'Failed to fetch from API, using fallback translations'
    });
  }
}

