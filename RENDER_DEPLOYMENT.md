# 🚀 Super Simple Render + Vercel Deployment

## Why Render is Perfect for This Project

✅ **Free tier available**  
✅ **Auto-deploys from GitHub**  
✅ **Zero configuration needed**  
✅ **Built-in environment variables**  
✅ **Automatic SSL certificates**  

## Step-by-Step Deployment (5 minutes)

### 1. Deploy Backend to Render

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to [render.com](https://render.com)**
   - Sign up/login with your GitHub account

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `powerBiChat`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variable**:
   - In the service settings, add:
   - `OPENAI_API_KEY` = `your-openai-api-key-here`

5. **Deploy**: Click "Create Web Service"

🎉 **Your backend will be live at**: `https://your-app-name.onrender.com`

### 2. Deploy Frontend to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**:
   ```bash
   vercel login
   vercel
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-name.onrender.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-key
   CLERK_SECRET_KEY=your-clerk-secret
   POWERBI_CLIENT_ID=your-powerbi-client-id
   POWERBI_CLIENT_SECRET=your-powerbi-secret
   POWERBI_TENANT_ID=your-tenant-id
   POWERBI_REPORT_ID=your-report-id
   POWERBI_WORKSPACE_ID=your-workspace-id
   POWERBI_DATASET_ID=your-dataset-id
   POWERBI_EMBED_URL=https://app.powerbi.com/reportEmbed
   ```

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Update CORS in Backend

After deployment, update your backend CORS in `backend/main.py`:

```python
allowed_origins = [
    "http://localhost:3000",           # Local development
    "https://your-vercel-app.vercel.app",  # Your Vercel domain
    "https://*.vercel.app",            # All Vercel preview deployments
]
```

Then commit and push - Render will auto-deploy!

## Update Clerk Settings

In [Clerk Dashboard](https://dashboard.clerk.com):
1. **Domains** → Add: `https://your-vercel-app.vercel.app`
2. **Paths** → Update redirect URLs to your Vercel domain

## Test Your Deployment

```bash
# Test backend
curl https://your-backend-name.onrender.com/

# Test frontend
curl https://your-vercel-app.vercel.app/
```

## Why This Setup Rocks

| Service | Purpose | Cost | Features |
|---------|---------|------|----------|
| **Render** | Backend API | Free | Auto-deploy, SSL, Environment vars |
| **Vercel** | Frontend | Free | Global CDN, Preview deployments |

**Total Cost**: $0/month (with free tiers)

## Quick Commands

```bash
# Redeploy frontend
vercel --prod

# View backend logs
# Go to render.com → Your service → Logs

# Update backend
git push origin main  # Auto-deploys on Render
```

## Troubleshooting

**Backend not starting?**
- Check logs in Render dashboard
- Verify `OPENAI_API_KEY` is set

**CORS errors?**
- Update `allowed_origins` in `main.py` with your Vercel URL
- Push changes to trigger auto-deploy

**Clerk auth failing?**
- Add Vercel domain to Clerk allowed origins
- Check environment variables in Vercel

That's it! Your app will be live and auto-deploying. 🚀