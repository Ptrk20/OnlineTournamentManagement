@echo off
REM Start PHP Development Server for Online Tournament Management
REM This batch file starts the PHP built-in server on all interfaces for LAN access

echo Starting PHP Development Server...
echo.
echo Server will be available at:
echo - Local PC: http://localhost:8000
echo - LAN devices (phone): http://YOUR-PC-IP:8000
echo.
echo Press CTRL+C to stop the server.
echo.

cd /d "%~dp0"
php -S 0.0.0.0:8000

pause
