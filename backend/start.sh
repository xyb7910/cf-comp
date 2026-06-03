#!/bin/bash

# Codeforces Companion Backend 启动脚本

cd "$(dirname "$0")"

echo "检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3，请先安装 Python 3.8+"
    exit 1
fi

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 数据库迁移
echo "运行数据库迁移..."
python manage.py migrate

# 启动服务器
echo "启动开发服务器..."
echo "访问 http://localhost:8000"
python manage.py runserver
