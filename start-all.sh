#!/bin/bash

# 同时启动前端和 Django 后端

echo "=========================================="
echo "  Codeforces Companion - 启动前后端"
echo "=========================================="

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到 Python3，请先安装"
    exit 1
fi

# 检查 Node
if ! command -v npm &> /dev/null; then
    echo "❌ 未找到 npm，请先安装 Node.js"
    exit 1
fi

echo ""
echo "📦 启动 Django 后端..."

# 启动后端
cd "$BACKEND_DIR"

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "安装后端依赖..."
pip install -r requirements.txt -q

# 数据库迁移
echo "运行数据库迁移..."
python manage.py migrate --run-syncdb

# 启动 Django
echo "🚀 Django 后端启动在 http://localhost:8000"
python manage.py runserver 8000 &
DJANGO_PID=$!

cd "$PROJECT_ROOT"

echo ""
echo "📦 启动前端..."

# 安装前端依赖
npm install --silent

# 启动前端
echo "🚀 前端启动在 http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  ✅ 前后端已启动！"
echo "=========================================="
echo ""
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8000"
echo "  Django Admin: http://localhost:8000/admin"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "=========================================="

# 等待子进程
trap "kill $DJANGO_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait