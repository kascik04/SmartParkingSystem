@echo off
echo Starting AI Service...
echo.

cd /d "%~dp0"

if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/updating requirements...
pip install -r requirements.txt
echo.

echo Starting Flask server...
python app.py

pause