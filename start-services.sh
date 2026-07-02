#!/bin/bash

echo "🚀 Starting PixelPDF Services..."

# Start Python AI service in background
echo "🤖 Starting AI Inference Service on port 8000..."
cd ai-inference
python3 app.py &
AI_PID=$!
cd ..

# Wait for AI service to be ready
echo "⏳ Waiting for AI service to be ready..."
sleep 5

# Start Node.js server
echo "🌐 Starting Node.js server on port 3000..."
node server.js

# Cleanup on exit
trap "kill $AI_PID" EXIT
