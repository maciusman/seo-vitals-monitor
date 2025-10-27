@echo off
title SEO Vitals Monitor - Lokalna Aplikacja
color 0A

echo.
echo ========================================
echo   SEO VITALS MONITOR
echo   Lokalna Aplikacja do Monitoringu SEO
echo ========================================
echo.

REM Sprawdź czy Python jest zainstalowany
python --version >nul 2>&1
if errorlevel 1 (
    echo [BLAD] Python nie jest zainstalowany!
    echo.
    echo Pobierz Python z: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python zainstalowany
echo.

REM Sprawdź czy folder venv istnieje
if not exist "venv" (
    echo [INFO] Tworzenie srodowiska wirtualnego...
    python -m venv venv
    echo [OK] Srodowisko wirtualne utworzone
    echo.
)

REM Aktywuj venv
echo [INFO] Aktywacja srodowiska wirtualnego...
call venv\Scripts\activate.bat

REM Sprawdź czy requirements są zainstalowane
if not exist "venv\Lib\site-packages\flask" (
    echo [INFO] Instalacja zaleznosci...
    pip install -r requirements.txt
    echo [OK] Zaleznosci zainstalowane
    echo.
)

REM Uruchom aplikację
echo [INFO] Uruchamianie aplikacji...
echo.
echo ========================================
echo   Dashboard dostepny pod:
echo   http://localhost:5000
echo ========================================
echo.
echo Aby zatrzymac aplikacje, nacisnij Ctrl+C
echo.

python app.py

pause
