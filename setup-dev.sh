#!/bin/bash

# PowerBI Chat Development Script
# This script sets up and runs the development environment

set -e

echo "🚀 Starting PowerBI Chat Development Environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
pnpm install

# Check if Python virtual environment exists
if [ ! -d ".venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment and install backend dependencies
echo "📦 Installing backend dependencies..."
source .venv/bin/activate
cd backend
pip install -r requirements.txt
cd ..

# Create .env files if they don't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual values"
fi

if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your actual values"
fi

echo "✅ Development environment setup complete!"
echo ""
echo "To start development servers:"
echo "  Terminal 1: pnpm dev"
echo "  Terminal 2: source .venv/bin/activate && cd backend && uvicorn main:app --reload --port 8000"
echo ""
echo "Or use Docker for development:"
echo "  docker-compose -f docker-compose.dev.yml up --build"