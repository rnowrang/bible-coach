# Accessing the Bible Memorization App

## ✅ App Status
- **Status**: Running on remote DGX Spark server
- **Port**: 3000
- **Health Check**: http://localhost:3000/api/health ✅

## 🔗 Access from Your Local Machine

### Step 1: Set up SSH Port Forwarding

On your **local machine** (not on the remote server), run:

```bash
ssh -L 3000:localhost:3000 rnowrang@spark-raja
```

This will:
- Forward port 3000 from the remote server to your local port 3000
- Keep the SSH connection open (don't close this terminal)

### Step 2: Access the App

Once SSH port forwarding is active, open your browser and go to:

**http://localhost:3000**

You should see the Bible Memorization App home page!

## 📝 Quick Commands

### Check if app is running (on remote server):
```bash
cd ~/app-dev/bible
docker-compose ps
```

### View app logs (on remote server):
```bash
cd ~/app-dev/bible
docker-compose logs -f app
```

### Restart the app (on remote server):
```bash
cd ~/app-dev/bible
docker-compose restart app
```

### Stop the app (on remote server):
```bash
cd ~/app-dev/bible
docker-compose down
```

### Start the app (on remote server):
```bash
cd ~/app-dev/bible
docker-compose up -d
docker-compose exec -d app npm run dev
```

## 🎯 Next Steps

1. **Keep SSH port forwarding running** - Don't close that terminal
2. **Open browser** - Go to http://localhost:3000
3. **Start memorizing!** - Select a verse and practice

## 🔧 Troubleshooting

### Port 3000 already in use locally?
Use a different local port:
```bash
ssh -L 3001:localhost:3000 rnowrang@spark-raja
```
Then access at http://localhost:3001

### Can't connect?
- Make sure SSH port forwarding is running
- Check that the app container is running: `docker-compose ps`
- Check app logs: `docker-compose logs app`

### App not responding?
- Restart the container: `docker-compose restart app`
- Check if Next.js is running: `docker-compose exec app ps aux | grep next`


