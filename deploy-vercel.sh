#!/bin/bash

# Quick Vercel Deployment Script
# This script helps deploy your PowerBI Chat app to Vercel

set -e

echo "🚀 PowerBI Chat - Vercel Deployment"
echo "=================================="

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if we're logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo "🔍 Pre-deployment checklist:"
echo "  ✓ Make sure you've set up environment variables in Vercel dashboard"
echo "  ✓ Update Clerk allowed origins with your Vercel domain"
echo "  ✓ Deploy your backend first (Railway/Render/Fly.io)"
echo "  ✓ Update NEXT_PUBLIC_API_BASE_URL with your backend URL"
echo ""

read -p "Have you completed the checklist? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please complete the checklist first"
    echo "📖 See DEPLOYMENT.md for detailed instructions"
    exit 1
fi

echo "🏗️  Building the application..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🌐 Deploying to Vercel..."
    
    # Deploy to production
    vercel --prod
    
    echo ""
    echo "🎉 Deployment complete!"
    echo ""
    echo "📋 Post-deployment steps:"
    echo "  1. Test your deployed app"
    echo "  2. Update backend CORS with your Vercel URL"
    echo "  3. Update Clerk allowed origins"
    echo "  4. Test authentication and Power BI embedding"
    echo ""
    echo "🔗 Useful commands:"
    echo "  vercel --prod          # Redeploy"
    echo "  vercel logs            # View logs"
    echo "  vercel env ls          # List environment variables"
    echo "  vercel domains         # Manage domains"
else
    echo "❌ Build failed! Please fix the errors and try again."
    exit 1
fi