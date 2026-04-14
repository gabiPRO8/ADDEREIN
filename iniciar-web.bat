@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo  ADDEREIN - Servidor local
echo  URL: http://localhost:8080
echo ==========================================

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  py -m http.server 8080
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8080"
  python -m http.server 8080
  goto :eof
)

echo.
echo No se encontro Python instalado.
echo Instala Python y vuelve a ejecutar este archivo.
echo Descarga: https://www.python.org/downloads/
echo.
pause
