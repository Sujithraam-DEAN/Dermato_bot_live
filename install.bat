@echo off
echo Installing DermaLLaMa-GPT...

echo.
echo Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo Installation Complete!
echo.
echo To start the application:
echo 1. Start backend: cd backend && npm run dev
echo 2. Start frontend: cd frontend && npm run dev
echo.
echo Make sure to update your .env files with proper API keys!
pause