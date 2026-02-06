@echo off
REM Git stub for Windows to prevent build errors

if "%1"=="rev-parse" (
  if "%2"=="--short" (
    echo v0-build
    exit /b 0
  )
  if "%2"=="--show-toplevel" (
    cd /d %cd%
    exit /b 0
  )
  exit /b 0
)

if "%1"=="describe" (
  echo v0-build
  exit /b 0
)

exit /b 0
