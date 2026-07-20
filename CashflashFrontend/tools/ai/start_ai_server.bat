@echo off
setlocal

cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
  ".venv\Scripts\python.exe" ai_chat_api.py
  goto :eof
)

if exist "venv\Scripts\python.exe" (
  "venv\Scripts\python.exe" ai_chat_api.py
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  py ai_chat_api.py
  goto :eof
)

python ai_chat_api.py
