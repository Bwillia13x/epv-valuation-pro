#!/bin/bash

# EPV Valuation Pro - Vercel Deployment Script
echo "🚀 Deploying EPV Valuation Pro to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project
echo "📦 Building project..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo "🔗 Your app is now live on Vercel!"