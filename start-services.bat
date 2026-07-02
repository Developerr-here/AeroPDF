@echo off
echo 🚀 Starting PixelPDF Services...

REM 1. Start Python AI service in the background
echo 🤖 Starting AI Inference Service on port 8000...
cd ai-inference
start /B python app.py
cd ..

REM 2. Wait for AI service to be ready
echo ⏳ Waiting for AI service to be ready...
timeout /t 5 /nobreak

REM 3. Start Node.js server
echo 🌐 Starting Node.js server on port 3000...
node server.js
