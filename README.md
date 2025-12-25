# Bible Memorization App

A user-friendly web application to help you memorize Bible verses with AI-powered coaching and feedback.

## Features

- **Verse Selection**: Pick any verse from the Bible (book/chapter/verse)
- **Multiple Translations**: Choose from popular Bible translations (ESV, NIV, KJV, etc.)
- **Speech Recognition**: Record your recitation using your browser's microphone
- **AI Coaching**: Get instant feedback on accuracy, mistakes, and encouragement
- **Progress Tracking**: Track which verses you've memorized
- **Simple & Clean UI**: Mobile-friendly interface

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Bible API**: API.Bible (free tier: 5,000 calls/month)
- **AI Feedback**: OpenAI API (GPT-4o-mini)
- **Speech Recognition**: Browser Web Speech API
- **Storage**: localStorage (for MVP)

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- API Keys:
  - **API.Bible**: Get free API key at https://api.bible/
  - **OpenAI**: Get API key at https://platform.openai.com/

## Setup

### 1. Get API Keys

1. **API.Bible**:
   - Visit https://api.bible/
   - Sign up for free account
   - Get your API key (5,000 free calls/month)

2. **OpenAI**:
   - Visit https://platform.openai.com/
   - Create account and add credits
   - Get your API key

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
# Bible API Configuration
API_BIBLE_KEY=your_api_bible_key_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# App Configuration
APP_PORT=3000
PROJECT_NAME=bible
```

### 3. Start the Application

#### Using Docker (Recommended)

```bash
cd ~/app-dev/bible
docker-compose up -d
```

#### Local Development

```bash
cd ~/app-dev/bible
npm install
npm run dev
```

### 4. Access the Application

- **App**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

### Local Access via SSH (NVIDIA Spark)

Forward ports from NVIDIA Spark to local machine:
```bash
ssh -L 3000:localhost:3000 rnowrang@spark-raja
```

Then access at http://localhost:3000

## Usage

1. **Select a Verse**:
   - Click "Select a Verse to Memorize"
   - Choose Bible translation
   - Select book, chapter, and verse
   - Click "Start Memorizing"

2. **Study Mode**:
   - Read the verse carefully
   - Click "I'm Ready to Practice" when ready

3. **Practice Mode**:
   - Click "Start Recording"
   - Recite the verse from memory
   - Click "Stop Recording"
   - Click "Get Feedback"

4. **Review Feedback**:
   - See accuracy percentage
   - Review mistakes and suggestions
   - Try again or mark as memorized (if accuracy ≥ 90%)

## Project Structure

```
bible/
├── app/
│   ├── api/              # API routes
│   │   ├── bibles/       # List available Bible translations
│   │   ├── verse/        # Fetch specific verse
│   │   └── feedback/     # Get AI feedback on recitation
│   ├── select/           # Verse selection page
│   ├── practice/         # Practice and feedback page
│   └── page.tsx          # Home page
├── lib/
│   └── bible-api.ts      # Bible API client
├── types/
│   └── speech-recognition.d.ts  # Web Speech API types
├── docker/               # Docker configurations
└── PLAN.md              # Detailed project plan
```

## Development

### Viewing Logs

```bash
docker-compose logs -f app
```

### Installing Dependencies

```bash
docker-compose exec app npm install <package-name>
```

### Building for Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Browser Compatibility

- **Speech Recognition**: Works best in Chrome/Edge (WebKit Speech Recognition)
- **Fallback**: Manual text input available if speech recognition not supported
- **Mobile**: Fully responsive, works on mobile browsers

## API Usage Limits

- **API.Bible**: 5,000 calls/month (free tier)
- **OpenAI**: Pay-as-you-go (very affordable for MVP usage)

## Future Enhancements

- User accounts and cloud sync
- Spaced repetition algorithm
- Verse search functionality
- Audio playback
- Progress analytics
- Daily reminders
- Verse categories/themes

## License

MIT
