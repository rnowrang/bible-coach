# Render.com Deployment Guide

This guide will help you deploy the Bible Memorization App to Render.com using Docker.

## Prerequisites

- GitHub repository: `rnowrang/bible-coach` (already connected)
- Render.com account (free tier available)
- API keys:
  - `API_BIBLE_KEY` - Your API.Bible key
  - `OPENAI_API_KEY` - Your OpenAI API key

## Step-by-Step Deployment

### 1. Push Changes to GitHub

First, commit and push the new deployment files:

```bash
cd /home/rnowrang/app-dev/bible
git add docker/Dockerfile.prod next.config.js render.yaml .dockerignore RENDER_DEPLOYMENT.md
git commit -m "Add Render.com Docker deployment configuration"
git push
```

### 2. Create Render.com Account

1. Go to https://render.com
2. Sign up with your GitHub account (recommended for easy repo access)
3. Verify your email if prompted

### 3. Deploy Using render.yaml (Recommended)

#### Option A: Using Render Dashboard

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository: `rnowrang/bible-coach`
4. Render will automatically detect `render.yaml` and configure the service
5. Review the configuration and click **"Apply"**
6. Render will start building your Docker image

#### Option B: Manual Configuration

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `rnowrang/bible-coach`
4. Configure the service:
   - **Name**: `bible-memorization-app`
   - **Region**: `Oregon` (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `docker/Dockerfile.prod`
   - **Docker Context**: `.`
   - **Build Command**: (leave empty - handled by Dockerfile)
   - **Start Command**: (leave empty - handled by Dockerfile)
   - **Plan**: `Starter` (free tier)

### 4. Configure Environment Variables

In the Render dashboard, go to your service → **Environment** tab and add:

```
NODE_ENV=production
API_BIBLE_KEY=your_api_bible_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

**Important**: 
- Click **"Save Changes"** after adding each variable
- These are marked as secrets and won't be visible after saving
- Make sure there are no extra spaces or quotes

### 5. Set Health Check

1. Go to **Settings** → **Health Check**
2. Set **Health Check Path**: `/api/health`
3. Save changes

### 6. Monitor Deployment

1. Go to the **Logs** tab to watch the build progress
2. The build will take 5-10 minutes on first deployment
3. Look for:
   - ✅ "Build successful"
   - ✅ "Starting service..."
   - ✅ "Service is live"

### 7. Access Your App

Once deployed, your app will be available at:
```
https://bible-memorization-app.onrender.com
```

(Your actual URL will be shown in the Render dashboard)

## Post-Deployment

### Test Your Deployment

1. Visit your app URL
2. Test the health endpoint: `https://your-app.onrender.com/api/health`
3. Try selecting a verse and testing the speech recognition

### Free Tier Limitations

- **Spin-down**: Services spin down after 15 minutes of inactivity
- **Cold starts**: First request after spin-down takes 30-60 seconds
- **Build time**: Limited to 90 minutes
- **Bandwidth**: 100 GB/month included

### Upgrading (Optional)

If you need:
- No spin-downs (always-on)
- Faster cold starts
- More resources
- Custom domains

Upgrade to a paid plan in **Settings** → **Plan**.

## Troubleshooting

### Build Fails

**Error**: "Cannot find module" or "Build failed"
- **Solution**: Check that `package.json` has all dependencies listed
- Check logs for specific error messages

**Error**: "Dockerfile not found"
- **Solution**: Verify `docker/Dockerfile.prod` exists in your repo
- Check that Docker Context is set to `.` (root directory)

### App Won't Start

**Error**: "Port 3000 already in use"
- **Solution**: Render handles this automatically, but verify `PORT` env var is not set

**Error**: "Cannot connect to database" (if you add one later)
- **Solution**: Check environment variables are set correctly

### API Errors

**Error**: "Unauthorized" from API.Bible
- **Solution**: Verify `API_BIBLE_KEY` is set correctly in Render dashboard
- Check that the key hasn't expired

**Error**: "OpenAI API error"
- **Solution**: Verify `OPENAI_API_KEY` is set correctly
- Check your OpenAI account has credits

### Health Check Fails

**Error**: Health check returns non-200
- **Solution**: Verify `/api/health` endpoint exists and returns `{ status: "ok" }`
- Check logs for errors in the health endpoint

## Updating Your App

After making changes:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. Render will automatically detect the push (if auto-deploy is enabled)
3. A new build will start automatically
4. Monitor the **Logs** tab for build progress

## Manual Deploy

To manually trigger a deploy:
1. Go to your service in Render dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

## Rollback

If a deployment fails:
1. Go to **Deploys** tab
2. Find the last successful deployment
3. Click **"Rollback"**

## Monitoring

- **Logs**: Real-time logs in the dashboard
- **Metrics**: CPU, memory, and request metrics
- **Events**: Deployment and service events

## Security Notes

- ✅ Environment variables are encrypted at rest
- ✅ HTTPS is enabled automatically
- ✅ Non-root user runs the container
- ✅ Secrets are never exposed in logs

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure auto-scaling (if needed)
- [ ] Set up monitoring alerts
- [ ] Add CI/CD pipeline (optional)

## Support

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Render Status: https://status.render.com

