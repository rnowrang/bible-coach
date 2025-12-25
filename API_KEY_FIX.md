# Fixing API.Bible Key Issue

## Current Issue
The API.Bible key in your `.env` file is returning "bad api-key" errors. 

## Quick Fix - Using Fallback Translations
I've added fallback translations so the app will work immediately, but you should still fix your API key for full functionality.

## Steps to Fix API Key

### Option 1: Get a New API Key from API.Bible

1. **Visit**: https://api.bible/
2. **Sign up** for a free account (if you don't have one)
3. **Log in** to your account
4. **Go to API Keys** section in your dashboard
5. **Copy your API key**
6. **Update `.env` file**:
   ```bash
   nano ~/app-dev/bible/.env
   ```
   Replace `API_BIBLE_KEY=gtn5It7qn8yRpDyy9S2gH` with your new key

7. **Restart the app**:
   ```bash
   cd ~/app-dev/bible
   docker-compose restart app
   docker-compose exec -d app npm run dev
   ```

### Option 2: Verify Current Key

Your current key might be:
- Expired
- Invalid format
- Not activated

Check your API.Bible dashboard to verify the key is active.

## Testing the Fix

After updating the key, test it:
```bash
cd ~/app-dev/bible
docker-compose exec app node -e "
const apiKey = process.env.API_BIBLE_KEY;
fetch('https://api.scripture.api.bible/v1/bibles', {
  headers: { 'api-key': apiKey }
})
.then(r => r.json())
.then(data => console.log('Success:', data.data ? data.data.length + ' bibles found' : 'Error:', data))
.catch(e => console.error('Error:', e.message));
"
```

If successful, you should see "Success: X bibles found"

## Note
The app will work with fallback translations even if the API key is invalid, but you'll get better results with a valid API key that can fetch the latest Bible translations.


