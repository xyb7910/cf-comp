@echo off
REM Codeforces Companion Backend 启动脚本 (Windows)

cd /d "%~dp0"

echo 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo 激活虚拟环境...
call venv\Scripts\activate

REM 安装依赖
echo 安装依赖...
pip install -r requirements.txt

REM 数据库迁移
echo 运行数据库迁移...
python manage.py migrate

REM 启动服务器
echo 启动开发服务器...
echo 访问 http://localhost:8000
python manage.py runserver

pause
