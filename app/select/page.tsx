'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BIBLE_BOOKS } from '@/lib/bible-api';

interface Bible {
  id: string;
  name: string;
  abbreviation: string;
  language?: string;
  isEnglish?: boolean;
}

const DEFAULT_TRANSLATION_KEY = 'defaultBibleTranslation';

export default function SelectVerse() {
  const router = useRouter();
  const [bibles, setBibles] = useState<Bible[]>([]);
  const [selectedBible, setSelectedBible] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [defaultTranslation, setDefaultTranslation] = useState<string>('');
  const [totalTranslations, setTotalTranslations] = useState<number>(0);
  const [englishCount, setEnglishCount] = useState<number>(0);

  // Load default translation from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedDefault = localStorage.getItem(DEFAULT_TRANSLATION_KEY);
    if (savedDefault) {
      setDefaultTranslation(savedDefault);
    }
  }, []);

  useEffect(() => {
    // Load available Bibles
    fetch('/api/bibles')
      .then((res) => res.json())
      .then((data) => {
        if (data.bibles && data.bibles.length > 0) {
          setBibles(data.bibles);
          setTotalTranslations(data.total || data.bibles.length);
          setEnglishCount(data.englishCount || data.bibles.filter((b: Bible) => b.isEnglish).length);
          
          // Use saved default translation if it exists and is valid
          const savedDefault = localStorage.getItem(DEFAULT_TRANSLATION_KEY);
          const defaultExists = savedDefault && data.bibles.some((b: Bible) => b.id === savedDefault);
          
          if (defaultExists) {
            setSelectedBible(savedDefault);
          } else {
            setSelectedBible(data.bibles[0].id);
          }
        } else {
          console.error('No bibles returned from API');
          alert('Failed to load Bible translations. Please check your API key in .env file.');
        }
      })
      .catch((err) => {
        console.error('Error loading bibles:', err);
        alert('Failed to load Bible translations. Please check your API key.');
      });
  }, []);

  // Save default translation to localStorage
  const handleSetDefault = () => {
    if (selectedBible) {
      localStorage.setItem(DEFAULT_TRANSLATION_KEY, selectedBible);
      setDefaultTranslation(selectedBible);
    }
  };

  // Clear default translation
  const handleClearDefault = () => {
    localStorage.removeItem(DEFAULT_TRANSLATION_KEY);
    setDefaultTranslation('');
  };

  const isCurrentDefault = selectedBible === defaultTranslation;

  const selectedBookData = BIBLE_BOOKS.find((b) => b.id === selectedBook);
  const maxChapters = selectedBookData?.chapters || 1;
  const maxVerses = 50; // Approximate max verses per chapter

  const handleStart = () => {
    if (!selectedBible || !selectedBook) {
      alert('Please select a Bible translation and book');
      return;
    }

    const verseId = `${selectedBook}.${selectedChapter}.${selectedVerse}`;
    router.push(
      `/practice?bibleId=${selectedBible}&verseId=${verseId}&book=${selectedBook}&chapter=${selectedChapter}&verse=${selectedVerse}`
    );
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-6">Select a Verse</h1>

          <div className="space-y-6">
            {/* Bible Translation */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bible Translation
                </label>
                {mounted && totalTranslations > 0 && (
                  <span className="text-xs text-gray-500">
                    {totalTranslations} translations ({englishCount} English)
                  </span>
                )}
              </div>
              <select
                value={selectedBible}
                onChange={(e) => setSelectedBible(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {bibles.map((bible) => (
                  <option key={bible.id} value={bible.id}>
                    {bible.name} ({bible.abbreviation})
                    {!bible.isEnglish && bible.language ? ` [${bible.language}]` : ''}
                    {bible.id === defaultTranslation ? ' ⭐' : ''}
                  </option>
                ))}
              </select>
              
              {/* Default Translation Controls */}
              {mounted && selectedBible && (
                <div className="mt-2 flex items-center gap-2">
                  {isCurrentDefault ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <span>⭐</span> Default translation
                      </span>
                      <button
                        onClick={handleClearDefault}
                        className="text-xs text-gray-500 hover:text-red-600 underline"
                      >
                        Clear default
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSetDefault}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>☆</span> Set as default
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Book */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setSelectedChapter(1);
                  setSelectedVerse(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a book</option>
                {BIBLE_BOOKS.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter and Verse */}
            {selectedBook && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chapter
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxChapters}
                    value={selectedChapter}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setSelectedChapter(Math.min(Math.max(1, val), maxChapters));
                      setSelectedVerse(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verse
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxVerses}
                    value={selectedVerse}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setSelectedVerse(Math.min(Math.max(1, val), maxVerses));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!selectedBible || !selectedBook || loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Start Memorizing'}
            </button>

            <Link
              href="/"
              className="block text-center text-blue-600 hover:text-blue-700"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

