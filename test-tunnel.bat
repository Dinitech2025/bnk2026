@echo off
echo Testing SSH Tunnel Connection...
echo.

REM Test if port is listening
netstat -an | findstr "5433"
echo.

REM Try to connect using psql if available
where psql >nul 2>&1
if %errorlevel% equ 0 (
    echo Testing PostgreSQL connection...
    psql -h localhost -p 5433 -U admin -d dinitech-base -c "SELECT version();"
) else (
    echo psql not found in PATH
)

pause







