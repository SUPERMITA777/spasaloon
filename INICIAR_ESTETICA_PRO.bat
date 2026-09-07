@echo off
title Estetica Pro — Sistema de Gestion Integral
color 0D

echo ======================================================
echo    ESTETICA PRO — SISTEMA DE GESTION INTEGRAL
echo ======================================================
echo.
echo Iniciando servidor local offline y base de datos...
echo.

cd /d "%~dp0"

:: Iniciar el servidor local en segundo plano
start /B npx tsx server/index.ts

:: Esperar 3 segundos para asegurar que el servidor este listo
timeout /t 3 /nobreak >nul

:: Abrir el navegador predeterminado en la aplicacion
start http://localhost:3100

echo.
echo ======================================================
echo  [OK] El sistema esta funcionando correctamente.
echo  PC Local:     http://localhost:3100
echo  Portal Movil: Escanea el QR desde la aplicacion
echo.
echo  NO CIERRES ESTA VENTANA mientras uses el sistema.
echo ======================================================
echo.
pause
