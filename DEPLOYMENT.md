# 🚀 Vercel Deployment Guide

## Quick Vercel Deployment

### 1. Frontend Deployment

#### Option A: Deploy via Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

#### Option B: Deploy via GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Deploy

### 2. Backend Deployment Options

#### Option A: Railway (Recommended for FastAPI)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy backend
cd backend
railway up
```

#### Option B: Render
```bash
# Create render.yaml in backend folder
cd backend
# Upload to Render via GitHub integration
```

#### Option C: Fly.io
```bash
# Install flyctl
# macOS
brew install flyctl

# Deploy
cd backend
fly launch
fly deploy
```

## Environment Variables Configuration

### Frontend (Vercel)
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your-publishable-key
CLERK_SECRET_KEY=sk_live_your-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Power BI Configuration
POWERBI_CLIENT_ID=your-azure-app-client-id
POWERBI_CLIENT_SECRET=your-azure-app-client-secret
POWERBI_TENANT_ID=your-azure-tenant-id
POWERBI_SCOPE=https://analysis.windows.net/powerbi/api/.default
POWERBI_REPORT_ID=your-powerbi-report-id
POWERBI_WORKSPACE_ID=your-powerbi-workspace-id
POWERBI_DATASET_ID=your-powerbi-dataset-id
POWERBI_EMBED_URL=https://app.powerbi.com/reportEmbed

# API Endpoint (Update with your backend URL)
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.railway.app
```

### Backend (Railway/Render/Fly.io)
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Custom port (Railway auto-assigns)
PORT=8000
```

## CORS Configuration Updates

### Update Backend CORS for Production

Edit `backend/main.py`:

```python
# Configure CORS for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Local development
        "http://localhost:3001", 
        "https://your-app.vercel.app",     # Your Vercel domain
        "https://*.vercel.app",            # All Vercel preview deployments
        "https://horse-adequate-literally.ngrok-free.app",  # Your ngrok domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Clerk Configuration Updates

### 1. Update Clerk Dashboard
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your application
3. Go to **Domains** → **Frontend API**
4. Add your Vercel domain: `https://your-app.vercel.app`

### 2. Update Allowed Origins
In Clerk Dashboard → **Settings** → **Allowed Origins**:
- Add: `https://your-app.vercel.app`
- Add: `https://*.vercel.app` (for preview deployments)

### 3. Update Redirect URLs
In Clerk Dashboard → **Settings** → **Paths**:
- Sign-in URL: `https://your-app.vercel.app/sign-in`
- Sign-up URL: `https://your-app.vercel.app/sign-up`
- After sign-in: `https://your-app.vercel.app/`
- After sign-up: `https://your-app.vercel.app/`

## Ngrok Configuration (for Development)

If you want to keep using ngrok for development:

### 1. Start Ngrok
```bash
# For frontend
ngrok http 3000

# For backend (separate terminal)
ngrok http 8000
```

### 2. Update Environment Variables
```bash
# Add ngrok URLs to allowed origins
NEXT_PUBLIC_API_BASE_URL=https://your-backend-ngrok-url.ngrok-free.app
```

### 3. Update CORS in Backend
```python
allow_origins=[
    "http://localhost:3000",
    "https://your-app.vercel.app",
    "https://your-frontend-ngrok-url.ngrok-free.app",  # Your ngrok frontend
    "https://your-backend-ngrok-url.ngrok-free.app",   # Your ngrok backend
]
```

## Quick Deploy Script

Create this script for easy deployment:

```bash
#!/bin/bash
# deploy-vercel.sh

echo "🚀 Deploying to Vercel..."

# Build and deploy frontend
echo "📦 Building frontend..."
pnpm build

echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployed!"
echo "🔧 Don't forget to:"
echo "  1. Update CORS origins in backend"
echo "  2. Update Clerk allowed origins"
echo "  3. Set NEXT_PUBLIC_API_BASE_URL to your backend URL"
```

## Testing Deployment

### 1. Test Frontend
```bash
curl -I https://your-app.vercel.app
```

### 2. Test Backend
```bash
curl https://your-backend-url.railway.app/
```

### 3. Test Full Integration
1. Visit your Vercel app
2. Sign in with Clerk
3. Test Power BI embed
4. Test AI chat functionality

## Troubleshooting

### Common Issues

1. **CORS Errors**: Update backend CORS origins with your Vercel URL
2. **Clerk Authentication Fails**: Check allowed origins in Clerk dashboard
3. **API Calls Fail**: Verify `NEXT_PUBLIC_API_BASE_URL` environment variable
4. **Power BI Not Loading**: Check Power BI environment variables

### Debug Commands
```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Redeploy
vercel --prod --force
```

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render/Fly.io
- [ ] Environment variables configured
- [ ] CORS origins updated
- [ ] Clerk domains configured
- [ ] Power BI credentials set
- [ ] OpenAI API key configured
- [ ] Test authentication flow
- [ ] Test Power BI embedding
- [ ] Test AI chat functionality

## Cost Estimation

### Free Tier Limits
- **Vercel**: 100GB bandwidth, 6,000 build minutes
- **Railway**: $5/month after free tier
- **Render**: Free tier available with limitations
- **Fly.io**: Free allowances then pay-as-you-go

### Recommended Setup
- Frontend: Vercel (free)
- Backend: Railway ($5/month)
- **Total**: ~$5/month