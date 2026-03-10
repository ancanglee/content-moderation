#!/usr/bin/env bash
# ============================================================
# 日本内容审核系统 - 统一启停脚本
# 用法:
#   ./run.sh          启动前后端
#   ./run.sh stop     停止所有服务
#   Ctrl+C            交互模式下停止
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.run.pid"

# ---- 停止 ----
stop_all() {
    if [[ -f "$PID_FILE" ]]; then
        echo ""
        echo "正在停止服务..."
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
        echo "所有服务已停止。"
    else
        echo "没有正在运行的服务。"
    fi
}

if [[ "${1:-}" == "stop" ]]; then
    stop_all
    exit 0
fi

# ---- 前置检查 ----
if [[ ! -d "$SCRIPT_DIR/backend/.venv" ]]; then
    echo "后端虚拟环境不存在，正在创建..."
    cd "$SCRIPT_DIR/backend"
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
    cd "$SCRIPT_DIR"
fi

if [[ ! -d "$SCRIPT_DIR/frontend/node_modules" ]]; then
    echo "前端依赖不存在，正在安装..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    cd "$SCRIPT_DIR"
fi

# ---- 清理旧进程 ----
stop_all 2>/dev/null || true

# ---- 启动后端 ----
echo "启动后端 (端口 8001)..."
cd "$SCRIPT_DIR/backend"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# ---- 启动前端 ----
echo "启动前端 (端口 5173)..."
cd "$SCRIPT_DIR/frontend"
npx vite --port 5173 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# ---- 记录 PID ----
echo "$BACKEND_PID" > "$PID_FILE"
echo "$FRONTEND_PID" >> "$PID_FILE"

echo ""
echo "============================================"
echo "  日本内容审核系统已启动"
echo "  前端: http://localhost:5173"
echo "  后端: http://localhost:8001/docs"
echo "  按 Ctrl+C 停止所有服务"
echo "============================================"
echo ""

# ---- Ctrl+C 信号处理 ----
trap 'stop_all; exit 0' INT TERM

# ---- 等待子进程 ----
wait
