@echo off
echo ========================================
echo  Klonowanie SEO Vitals Monitor
echo ========================================
echo.

REM Sprawdz czy istnieje katalog docelowy
if exist "X:\Aplikacje\seo-vitals-monitor" (
    echo UWAGA: Katalog X:\Aplikacje\seo-vitals-monitor juz istnieje!
    echo.
    choice /C TN /M "Czy chcesz usunac istniejacy katalog i sklonowac na nowo? (T=Tak, N=Nie)"
    if errorlevel 2 goto :koniec
    if errorlevel 1 (
        echo Usuwam stary katalog...
        rmdir /S /Q "X:\Aplikacje\seo-vitals-monitor"
    )
)

REM Utworz katalog Aplikacje jesli nie istnieje
if not exist "X:\Aplikacje" (
    echo Tworze katalog X:\Aplikacje...
    mkdir "X:\Aplikacje"
)

REM Przejdz do katalogu
cd /d "X:\Aplikacje"

echo.
echo Klonuje repozytorium z GitHub...
echo.

REM Sklonuj repozytorium
git clone -b claude/seo-domain-monitoring-dashboard-011CUVsJyAG8qZtK2bGAHYGd https://github.com/maciusman/seo-vitals-monitor.git

if errorlevel 1 (
    echo.
    echo BLAD: Nie udalo sie sklonowac repozytorium!
    echo Sprawdz czy masz zainstalowany Git: https://git-scm.com/download/win
    echo.
    pause
    goto :koniec
)

echo.
echo ========================================
echo  SUKCES! Aplikacja sklonowana do:
echo  X:\Aplikacje\seo-vitals-monitor
echo ========================================
echo.
echo Co teraz?
echo 1. Przejdz do: X:\Aplikacje\seo-vitals-monitor
echo 2. Dwuklik na: uruchom.bat
echo 3. Otworz: http://localhost:5000
echo.

:koniec
pause
