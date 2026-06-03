@echo off
REM 同时启动前端和 Django 后端

echo ==========================================
echo   Codeforces Companion - 启动前后端
echo ==========================================

REM 获取项目根目录
set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%backend

REM 检查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Python，请先安装
    pause
    exit /b 1
)

REM 检查 Node
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo 📦 启动 Django 后端...

cd /d "%BACKEND_DIR%"

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate

REM 安装依赖
echo 安装后端依赖...
pip install -r requirements.txt -q

REM 数据库迁移
echo 运行数据库迁移...
python manage.py migrate --run-syncdb

REM 启动 Django（新窗口）
echo 🚀 Django 后端启动在 http://localhost:8000
start "Django Backend" cmd /k python manage.py runserver 8000

cd /d "%PROJECT_ROOT%"

echo.
echo 📦 启动前端...

REM 安装前端依赖
npm install --silent

REM 启动前端（新窗口）
echo 🚀 前端启动在 http://localhost:5173
start "Frontend" cmd /k npm run dev

echo.
echo ==========================================
echo   ✅ 前后端已启动！
echo ==========================================
echo.
echo   前端: http://localhost:5173
echo   后端: http://localhost:8000
echo   Django Admin: http://localhost:8000/admin
echo.
echo   关闭窗口即可停止服务
echo ==========================================

pause