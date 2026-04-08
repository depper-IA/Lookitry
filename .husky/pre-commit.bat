@echo off
echo 🔍 Verificando codigo...

REM Frontend lint
cd frontend
call npm run lint
set FRONTEND_LINT=%ERRORLEVEL%
cd ..

REM Backend lint  
cd backend
call npm run lint
set BACKEND_LINT=%ERRORLEVEL%
cd ..

REM Frontend build
cd frontend
call npm run build
set FRONTEND_BUILD=%ERRORLEVEL%
cd ..

REM Backend build
cd backend
call npm run build
set BACKEND_BUILD=%ERRORLEVEL%
cd ..

REM Si algun check falla, salir con error
if %FRONTEND_LINT% neq 0 (
  echo ❌ Frontend lint fallo
  exit /b 1
)

if %BACKEND_LINT% neq 0 (
  echo ❌ Backend lint fallo
  exit /b 1
)

if %FRONTEND_BUILD% neq 0 (
  echo ❌ Frontend build fallo
  exit /b 1
)

if %BACKEND_BUILD% neq 0 (
  echo ❌ Backend build fallo
  exit /b 1
)

echo ✅ Todos los checks pasaron
exit /b 0
