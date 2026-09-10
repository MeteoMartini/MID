@echo off
setlocal
cd /d "%~dp0"

echo MID Wetter - PowerPoint-Widget-Aktualisierung
echo Keine Installation und keine Administratorrechte erforderlich.
echo.

where powershell.exe >nul 2>&1
if errorlevel 1 goto fallback

powershell.exe -NoLogo -NoProfile -File "%~dp0Update-MID-Widgets.ps1"
if %ERRORLEVEL% EQU 0 goto success

echo.
echo Die automatische Aktualisierung wurde durch eine lokale oder Firmenrichtlinie verhindert.
goto fallback

:success
echo.
echo Fertig. Die vorhandenen PowerPoint-Dateinamen wurden nur nach erfolgreicher Validierung ersetzt.
pause
exit /b 0

:fallback
echo Es werden keine Sicherheitsrichtlinien umgangen und keine Programme installiert.
echo Oeffne die Browser-Fallbackseite ...
start "" "%~dp0MID-Widget-Fallback.html"
pause
exit /b 1
