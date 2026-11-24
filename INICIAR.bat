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

set "VOZERO_PORT="
pushd "backend" || goto :error
for /f %%P in ('.venv\Scripts\python.exe -c "from src.config.env import settings; print(settings.PORT)"') do set "VOZERO_PORT=%%P"
popd
if not defined VOZERO_PORT goto :error

set "VOZERO_URL=http://127.0.0.1:3000"
set "PUNTO_BACKEND_URL=http://127.0.0.1:%VOZERO_PORT%"
set "VOZERO_WEB_DELETE_SECRET="
for /f %%K in ('node.exe -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set "VOZERO_WEB_DELETE_SECRET=%%K"
if not defined VOZERO_WEB_DELETE_SECRET goto :error
powershell.exe -NoProfile -Command "$ports = @(3000, [int]$env:VOZERO_PORT); if ($ports[0] -eq $ports[1] -or (Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue)) { exit 1 }"
if errorlevel 1 (
  echo El puerto 3000 o %VOZERO_PORT% ya esta en uso. Cerra la instancia anterior de VoZero y volve a intentar.
  goto :error
)

echo Preparando el frontend...
pushd "frontend" || goto :error
call npm.cmd ci
set "PUNTO_NPM_RESULT=%ERRORLEVEL%"
popd
if not "%PUNTO_NPM_RESULT%"=="0" goto :error

echo Iniciando los dos servicios...
start "VoZero - Backend" /D "%~dp0backend" cmd /k ".venv\Scripts\python.exe -m src.main"
start "VoZero - Frontend" /D "%~dp0frontend" cmd /k "npm.cmd run dev -- --hostname 127.0.0.1 --port 3000"
echo Esperando a que la pagina y la API respondan...
powershell.exe -NoProfile -Command "$urls = @(($env:PUNTO_BACKEND_URL + '/health'), ($env:VOZERO_URL + '/'), ($env:VOZERO_URL + '/api/foro')); $limit = (Get-Date).AddSeconds(90); do { $ready = $true; foreach ($url in $urls) { curl.exe --noproxy '*' --fail --silent --output NUL --max-time 5 $url; if ($LASTEXITCODE -ne 0) { $ready = $false; break } }; if ($ready) { exit 0 }; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $limit); Write-Host ('No respondio: ' + $url); exit 1"
if errorlevel 1 goto :error

echo VoZero listo. Abriendo %VOZERO_URL% en Google Chrome...
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%VOZERO_URL%"
) else (
  start "" chrome.exe "%VOZERO_URL%"
  if errorlevel 1 start "" "%VOZERO_URL%"
)
exit /b 0

:error
echo No se pudieron iniciar los servicios. Revisa el mensaje de arriba y las ventanas de VoZero.
pause
exit /b 1
