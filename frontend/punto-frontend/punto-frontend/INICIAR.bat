@echo off
cd /d "%~dp0"
echo.
echo ====================================
echo    punto. - frontend escolar
echo ====================================
echo.
echo Abrir en el navegador: http://localhost:5500
echo Para detener el servidor: Ctrl + C
echo.
py -m http.server 5500
if errorlevel 1 python -m http.server 5500
pause
