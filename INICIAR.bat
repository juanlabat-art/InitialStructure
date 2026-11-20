@echo off
setlocal
cd /d "%~dp0"
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo No se encontro npm. Instala Node.js 20.9 o superior y volve a ejecutar INICIAR.bat.
  goto :error
)

if not exist "backend\.venv\Scripts\python.exe" (
  where py.exe >nul 2>&1
  if errorlevel 1 (
    python -m venv "backend\.venv"
  ) else (
    py -3 -m venv "backend\.venv"
  )
  if errorlevel 1 goto :error
)

echo Preparando el backend...
"backend\.venv\Scripts\python.exe" -m pip --version >nul 2>&1
if errorlevel 1 (
  "backend\.venv\Scripts\python.exe" -m ensurepip
  if errorlevel 1 goto :error
)
"backend\.venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if errorlevel 1 goto :error

echo Preparando el frontend...
pushd "frontend" || goto :error
call npm.cmd ci
set "PUNTO_NPM_RESULT=%ERRORLEVEL%"
popd
if not "%PUNTO_NPM_RESULT%"=="0" goto :error

echo Iniciando los dos servicios...
start "Punto - Backend" /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m src.main"
start "Punto - Frontend" /D "%~dp0frontend" cmd /k "npm.cmd run dev -- --hostname 127.0.0.1 --port 3000"
echo Frontend: http://localhost:3000
echo API: http://127.0.0.1:8000/docs ^(puerto predeterminado^)
exit /b 0

:error
echo No se pudieron iniciar los servicios. Revisa el mensaje de arriba.
pause
exit /b 1
