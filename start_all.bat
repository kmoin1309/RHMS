@echo off
echo ===================================================
echo 🚀 Starting Health Management System (All Services)
echo ===================================================

:: 1. HMS Backend (Port 8080)
echo Starting HMS Backend...
start "HMS Backend" cmd /k "cd backend && npm run dev"

:: 2. HMS Frontend (Port 5173/5174)
echo Starting HMS Frontend...
start "HMS Frontend" cmd /k "cd hms-website && npm run dev"

:: 3. Langchain Doctor App
echo Starting Langchain Doctor App...
start "Langchain Doctor" cmd /k "cd LangchainAgent\doctor && npm run dev"

:: 4. Langchain Server (Node.js)
echo Starting Langchain Server...
start "Langchain Server" cmd /k "cd LangchainAgent\server && node index.js"

:: 5. Langchain Python AI (Flask)
echo Starting Langchain AI Agent...
start "Langchain Python AI" cmd /k "cd LangchainAgent\server\python && myenv\Scripts\activate && python app.py"

:: 6. RHMS Prediction (Streamlit)
echo Starting RHMS Prediction Engine...
start "RHMS Prediction" cmd /k "cd RHMS-main && myenv\Scripts\activate && streamlit run predictionD.py"

echo ===================================================
echo ✅ All services have been launched in separate windows!
echo Please check each window for any errors.
echo ===================================================
pause
