#!/bin/bash

BASE_DIR="/Users/mdmoinuddinquazi/Developer/CIS2025/integrated code"
cd "$BASE_DIR"

echo "🛑 Killing existing processes..."
# Kill ports 8080, 5173-5176, 3000, 5000, 5001, 8501
lsof -ti:8080,5173,5174,5175,5176,3000,5000,5001,8501 | xargs kill -9 2>/dev/null

echo "🚀 Starting all services..."

# Helper to open new terminal window
open_terminal() {
    local title="$1"
    local cmd="$2"
    osascript <<EOF
tell application "Terminal"
    do script "echo -n -e '\\033]0;$title\\007'; cd \"$BASE_DIR\"; $cmd"
end tell
EOF
}

# 1. HMS Backend
open_terminal "HMS Backend" "cd backend && npm run dev"

# 2. HMS Frontend
open_terminal "HMS Frontend" "cd hms-website && npm run dev"

# 3. Langchain Doctor App
open_terminal "Langchain Doctor" "cd LangchainAgent/doctor && npm run dev"

# 4. Langchain Server
open_terminal "Langchain Server" "cd LangchainAgent/server && node index.js"

# 5. Langchain Python (AI)
open_terminal "Langchain Python AI" "./run_python_mac.sh LangchainAgent/server/python python app.py"

# 6. RHMS Prediction (Streamlit)
open_terminal "RHMS Prediction" "./run_python_mac.sh RHMS-main streamlit run predictionD.py"

echo "✅ All services launched in separate windows!"
echo "⚠️  Note: Python services may take a few minutes to start the first time as they install dependencies."
