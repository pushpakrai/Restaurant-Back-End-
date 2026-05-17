@echo off
echo ====================================================
echo    GitHub Upload Automation - Cafe Diamond Queen
echo    Backend Server
echo ====================================================

set /p REPO_URL="Enter your complete empty GitHub Repository URL for backend (e.g., https://github.com/your-username/cafe-backend.git): "

if "%REPO_URL%"=="" (
    echo Error: No URL provided. Exiting.
    pause
    exit /b
)

echo.
echo Initializing Git repository...
git init

echo.
echo Adding all files (excluding .env secrets)...
git add .

echo.
echo Committing Production Build...
git commit -m "feat: Final production backend with MongoDB models and Docker"

echo.
echo Setting branch to main...
git branch -M main

echo.
echo Linking to Remote GitHub Repository...
git remote add origin %REPO_URL%

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo ====================================================
echo SUCCESS - Backend is now live on GitHub!
echo ====================================================
pause
