@echo off
title Subestacion TFG - Servidor
color 0A

echo ============================================
echo   ASISTENTE DE DISEÑO DE SUBESTACIONES
echo ============================================
echo.

:: Buscar Python en las rutas más comunes
set PYTHON_EXE=
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" set PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python313\python.exe
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" set PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe
if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" set PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe
if exist "C:\Python313\python.exe" set PYTHON_EXE=C:\Python313\python.exe
if "%PYTHON_EXE%"=="" set PYTHON_EXE=python

echo [1/3] Instalando dependencias necesarias...
"%PYTHON_EXE%" -m pip install -r requirements.txt --quiet
echo       OK
echo.

echo [2/3] Iniciando servidor local...
echo.
echo ============================================
echo   Abre tu navegador en: http://127.0.0.1:5000
echo ============================================
echo.

:: Abrir el navegador automáticamente tras 2 segundos
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:5000"

echo [3/3] Servidor en marcha. Mantén esta ventana abierta.
echo       Para cerrar la aplicacion, cierra esta ventana.
echo.

"%PYTHON_EXE%" app.py

pause
