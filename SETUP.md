# Quick Setup Guide

## Step 1: Get API Keys

### API.Bible (Free)
1. Visit https://api.bible/
2. Click "Get Started" or "Sign Up"
3. Create a free account
4. Copy your API key from the dashboard
5. Free tier: 5,000 API calls/month

### OpenAI API
1. Visit https://platform.openai.com/
2. Sign up or log in
3. Add payment method (required, but very affordable for MVP)
4. Go to API Keys section
5. Create a new API key
6. Copy the key (you won't see it again!)

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
cd ~/app-dev/bible
cat > .env << EOF
API_BIBLE_KEY=your_api_bible_key_here
OPENAI_API_KEY=your_openai_api_key_here
APP_PORT=3000
PROJECT_NAME=bible
EOF
```

Then edit `.env` and replace the placeholder values with your actual API keys.

## Step 3: Start the App

### Option A: Docker (Recommended)
```bash
cd ~/app-dev/bible
docker-compose up -d
```

### Option B: Local Development
```bash
cd ~/app-dev/bible
npm install
npm run dev
```

## Step 4: Access the App

- Open http://localhost:3000 in your browser
- If running on NVIDIA Spark, use SSH port forwarding:
  ```bash
  ssh -L 3000:localhost:3000 rnowrang@spark-raja
  ```

## Step 5: Test It Out!

1. Click "Select a Verse to Memorize"
2. Choose a Bible translation (ESV, NIV, etc.)
3. Select a book (e.g., John)
4. Pick chapter and verse (e.g., John 3:16)
5. Click "Start Memorizing"
6. Read the verse, then click "I'm Ready to Practice"
7. Click "Start Recording" and recite the verse
8. Click "Stop Recording" and "Get Feedback"
9. Review your accuracy and feedback!

## Troubleshooting

### "API_BIBLE_KEY not configured"
- Make sure your `.env` file exists and has the correct key
- Restart Docker container: `docker-compose restart app`

### "Speech recognition not supported"
- Use Chrome or Edge browser (best support)
- Or use the manual text input option

### "Failed to fetch bibles"
- Check your API.Bible key is correct
- Verify you have internet connection
- Check API.Bible dashboard for usage limits

### "Failed to generate feedback"
- Check your OpenAI API key is correct
- Verify you have credits in your OpenAI account
- Check API usage in OpenAI dashboard

## Next Steps

- Try memorizing different verses
- Track your progress on the home page
- Mark verses as memorized when you reach 90%+ accuracy

Enjoy memorizing Bible verses! 📖✨


