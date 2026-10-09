@echo off
:: ============================================================
::  RenGoFun — Khởi động môi trường phát triển (Dev Mode)
::  Chạy file này mỗi khi bạn muốn bắt đầu làm việc với app.
:: ============================================================

title RenGoFun Dev Launcher

:: Đường dẫn gốc của project (tự động lấy từ vị trí file .bat này)
SET PROJECT_ROOT=%~dp0
SET PYTHON_ENGINE=%PROJECT_ROOT%python_engine
SET VENV_PYTHON=%PYTHON_ENGINE%\venv\Scripts\python.exe

echo.
echo  ================================================
echo   RenGoFun ^| Khoi dong moi truong phat trien
echo  ================================================
echo.

:: --- Kiem tra venv ton tai ---
IF NOT EXIST "%VENV_PYTHON%" (
    echo  [LOI] Khong tim thay venv tai: %VENV_PYTHON%
    echo  Hay chay: python -m venv venv  trong thu muc python_engine
    pause
    exit /b 1
)

echo  [1/2] Khoi dong Python Backend ^(FastAPI - Port 8000^)...
start "RenGoFun - Python Backend" cmd /k "cd /d "%PYTHON_ENGINE%" && "%VENV_PYTHON%" -m uvicorn main:app --port 8000 --reload"

:: Doi 3 giay de backend khoi dong truoc
timeout /t 3 /nobreak >nul

echo  [2/2] Khoi dong Tauri Frontend...
start "RenGoFun - Tauri Frontend" cmd /k "cd /d "%PROJECT_ROOT%" && npm run tauri dev"

echo.
echo  [OK] Ca hai tien trinh da duoc khoi dong!
echo  - Backend : http://localhost:8000
echo  - Frontend: Cua so Tauri se tu mo
echo.
echo  De tat app: dong ca 2 cua so terminal phia tren.
echo.
pause
