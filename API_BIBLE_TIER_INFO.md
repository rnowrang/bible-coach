# API.Bible Free Tier Limitations

## Important Discovery

You're absolutely right! The free tier of API.Bible has **limited access** to Bible translations.

## Free Tier (Starter Plan) Limitations

- **Access**: Only Creative Commons and Public Domain Bible versions
- **Examples**: World English Bible (WEB), American Standard Version (ASV), etc.
- **NOT Included**: Popular translations like ESV, NIV, KJV, NKJV, NASB, NLT (these require Pro Plan)
- **API Calls**: 5,000 per month
- **Usage**: Non-commercial only

## What This Means

1. **The app will now show ALL available translations** from your API key (not just filtered popular ones)
2. **If your key is valid**, you'll see the public domain translations available to you
3. **If you want popular translations** (ESV, NIV, etc.), you need to upgrade to the Pro Plan

## Pro Plan (Paid)

- **Access**: Popular translations (ESV, NIV, KJV, NKJV, NASB, NLT, CSB, The Message, etc.)
- **API Calls**: 150,000 per month
- **Cost**: Requires licensing fees if ads/revenue present
- **Sign up**: https://api.bible/

## Current App Behavior

The app has been updated to:
- ✅ Show **all available translations** from your API key (not filter to specific ones)
- ✅ Work with **any translations** your key has access to
- ✅ Use **fallback translations** if API fails

## Testing Your API Key

To see what translations your key actually has access to:

```bash
cd ~/app-dev/bible
docker-compose exec app node -e "
const apiKey = process.env.API_BIBLE_KEY;
fetch('https://api.scripture.api.bible/v1/bibles', {
  headers: { 'api-key': apiKey }
})
.then(r => r.json())
.then(data => {
  if (data.data) {
    console.log('Available Bibles:');
    data.data.forEach(b => console.log(\`- \${b.name} (\${b.abbreviation}) - \${b.id}\`));
  } else {
    console.log('Error:', data);
  }
})
.catch(e => console.error('Error:', e.message));
"
```

## Solution

The app will now work with **whatever translations your API key provides**. If you're on the free tier, you'll see public domain translations. If you upgrade to Pro, you'll see popular translations.

The verse fetching should work now because we're using whatever Bible IDs are actually available to your key!


