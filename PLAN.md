# Bible Memorization App - MVP Plan

## Core Value Proposition
Help users memorize Bible verses through interactive practice with AI-powered feedback and coaching.

## MVP Features (Keep It Simple)

### 1. Verse Selection
- **Simple**: Pre-loaded popular verses (10-20 verses)
- **User-friendly**: Clean list with verse reference and text
- **Future**: Search, categories, custom verses

### 2. Memorization Practice
- **Simple**: Click "Practice" → Read verse → Click "I'm Ready" → Speak
- **User-friendly**: Large, readable verse display
- **Future**: Difficulty levels, spaced repetition

### 3. AI Coaching
- **Simple**: 
  - Speech-to-text (browser Web Speech API - free, no API key needed)
  - Send transcription to LLM for feedback
  - Show: accuracy score, mistakes highlighted, encouragement
- **User-friendly**: Clear feedback, not overwhelming
- **Future**: Progressive hints, word-by-word coaching

### 4. Progress Tracking
- **Simple**: Mark verses as "Memorized" when accuracy > 90%
- **User-friendly**: Visual progress indicator
- **Future**: Review schedule, statistics

## Technical Architecture

### Frontend + Backend (Next.js Fullstack)
- **Why**: Single codebase, fast development, API routes for LLM calls
- **Tech**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Features**:
  - Verse selection UI (book/chapter/verse picker)
  - Translation selector
  - Verse display
  - Speech recording (Web Speech API)
  - Feedback display
  - Progress tracking (localStorage for MVP)

### Bible API Integration
- **API.Bible** (https://api.bible)
  - Free Starter Plan: 5,000 API calls/month
  - Supports 2,500+ Bible versions in 1,600+ languages
  - RESTful JSON API
  - Endpoints:
    - List Bibles (translations)
    - Get verses by reference
    - Search functionality
- **API Key**: Required (free registration)

### LLM Integration
- **Options**:
  1. **OpenAI API** (easiest, costs money)
  2. **Anthropic Claude** (good quality, costs money)
  3. **Local model** (free, but needs GPU/complex setup)
- **MVP Choice**: OpenAI API (simplest, reliable)
- **Prompt**: Compare user's recitation with verse, provide gentle feedback

### Speech-to-Text
- **MVP**: Browser Web Speech API (free, no backend needed)
- **Fallback**: If not available, manual text input
- **Future**: Backend STT service for better accuracy

## User Flow (MVP)

1. **Landing**: List of verses to memorize
2. **Select Verse**: Click on a verse
3. **Study Mode**: Display verse, user reads it
4. **Practice Mode**: 
   - Hide verse
   - Click "Start Recording"
   - User recites
   - Click "Stop Recording"
   - Show feedback
5. **Feedback Screen**:
   - Accuracy percentage
   - Mistakes highlighted
   - Encouragement message
   - "Try Again" or "Mark as Memorized"

## MVP Scope Boundaries

### ✅ Include
- **Verse Selection**: Pick any verse from Bible (book/chapter/verse)
- **Translation Selection**: Choose from popular translations (ESV, NIV, KJV, etc.)
- **Speech-to-text recording**: Browser Web Speech API
- **LLM feedback**: OpenAI API for accuracy checking and coaching
- **Simple progress tracking**: localStorage (memorized verses)
- **Clean, mobile-friendly UI**: Responsive design

### ❌ Exclude (for MVP)
- User accounts/login (use localStorage)
- Spaced repetition algorithm
- Advanced statistics
- Audio playback
- Social features
- Verse search (manual selection only)

## Tech Stack Decision

**Recommended**: Next.js Fullstack
- **Why**: 
  - Single codebase
  - API routes for LLM calls
  - Good for MVP speed
  - Easy deployment
- **Components**:
  - Frontend: React/Next.js
  - Backend: Next.js API routes
  - Database: SQLite (via Prisma or simple JSON file)
  - LLM: OpenAI API
  - STT: Browser Web Speech API

**Alternative**: React Frontend + Python FastAPI Backend
- **Why**: 
  - More separation of concerns
  - Better for future scaling
  - Python better for LLM integration
- **Trade-off**: More complex setup

## MVP Implementation Steps

1. **Setup Project** (Next.js fullstack template)
2. **Bible API Integration**: 
   - Set up API.Bible client
   - Create API route to fetch verses
   - List available translations
3. **UI Components**:
   - Verse selector (book/chapter/verse dropdowns)
   - Translation selector
   - Verse display page
   - Practice mode page
4. **Speech Recording**: Implement Web Speech API
5. **LLM Integration**: OpenAI API route for feedback
6. **Feedback Display**: Show accuracy, mistakes, encouragement
7. **Progress Tracking**: LocalStorage for MVP
8. **Polish**: Styling, error handling, loading states

## Environment Variables Needed

- `API_BIBLE_KEY` - API.Bible API key (free registration)
- `OPENAI_API_KEY` - OpenAI API key for LLM feedback

## Success Metrics (MVP)
- User can select a verse
- User can record their recitation
- System provides accurate feedback
- User can track which verses they've memorized
- App is usable on mobile

## Future Enhancements (Post-MVP)
- User accounts and cloud sync
- Spaced repetition algorithm
- Custom verses
- Multiple Bible translations
- Audio playback
- Progress analytics
- Daily reminders
- Verse categories/themes

