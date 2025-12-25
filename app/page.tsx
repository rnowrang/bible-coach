'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BIBLE_BOOKS } from '@/lib/bible-api';

export default function Home() {
  const [memorizedVerses, setMemorizedVerses] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load memorized verses from localStorage
    const stored = localStorage.getItem('memorizedVerses');
    if (stored) {
      setMemorizedVerses(JSON.parse(stored));
    }
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bible Memorization App
          </h1>
          <p className="text-lg text-gray-600">
            Memorize Bible verses with AI-powered coaching
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
          <Link
            href="/select"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Select a Verse to Memorize
          </Link>
        </div>

        {mounted && memorizedVerses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Your Progress ({memorizedVerses.length} verses)
            </h2>
            <div className="space-y-2">
              {memorizedVerses.map((verse, index) => (
                <div
                  key={index}
                  className="p-3 bg-green-50 border border-green-200 rounded"
                >
                  <span className="text-gray-700">{verse}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Select any verse from the Bible and practice memorizing it!</p>
        </div>
      </div>
    </main>
  );
}
