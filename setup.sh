#!/usr/bin/env bash
set -euo pipefail

echo "=== 日本内容审核系统 - 环境安装 ==="

# 后端
echo "[1/2] 安装后端依赖..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt
deactivate
cd ..

# 前端
echo "[2/2] 安装前端依赖..."
cd frontend
npm install
cd ..

echo ""
echo "安装完成！使用以下命令启动应用："
echo "  ./run.sh        # 启动前后端（Ctrl+C 停止）"
echo "  ./run.sh stop   # 停止所有服务"
echo "  # 或使用: make run / make stop"
