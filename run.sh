#!/usr/bin/env bash
# ============================================================
# 日本内容审核系统 - 统一启停脚本
# 用法:
#   ./run.sh          启动前后端
#   ./run.sh stop     停止所有服务
#   Ctrl+C            交互模式下停止
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$SCRIPT_DIR/.run.pid"
BACKEND_PORT=8001
FRONTEND_PORT=5173

# ---- 杀掉指定端口上的进程 ----
kill_port() {
    local port=$1
    local pid
    pid=$(lsof -i :"$port" -P -n 2>/dev/null | grep LISTEN | awk '{print $2}' | head -1)
    if [ -n "$pid" ]; then
        echo "端口 $port 被进程 $pid 占用，正在清理..."
        kill "$pid" 2>/dev/null
        sleep 1
    fi
}

# ---- 停止 ----
stop_all() {
    if [ -f "$PID_FILE" ]; then
        echo "正在停止服务..."
        while IFS= read -r pid; do
            kill "$pid" 2>/dev/null
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    kill_port $BACKEND_PORT
    kill_port $FRONTEND_PORT
    echo "所有服务已停止。"
}

if [ "${1:-}" = "stop" ]; then
    stop_all
    exit 0
fi

# ---- 前置检查 ----
if [ ! -d "$SCRIPT_DIR/backend/.venv" ]; then
    echo "后端虚拟环境不存在，正在创建..."
    cd "$SCRIPT_DIR/backend"
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
    cd "$SCRIPT_DIR"
fi

if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "前端依赖不存在，正在安装..."
    cd "$SCRIPT_DIR/frontend"
    npm install
    cd "$SCRIPT_DIR"
fi

# ---- 清理旧进程和端口 ----
stop_all 2>/dev/null

# ---- 确保 localhost 不走系统代理 ----
export no_proxy="localhost,127.0.0.1,::1"
export NO_PROXY="localhost,127.0.0.1,::1"

# ---- 启动后端 ----
echo "启动后端 (端口 $BACKEND_PORT)..."
cd "$SCRIPT_DIR/backend"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# ---- 启动前端 ----
echo "启动前端 (端口 $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/frontend"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# ---- 记录 PID ----
echo "$BACKEND_PID" > "$PID_FILE"
echo "$FRONTEND_PID" >> "$PID_FILE"

echo ""
echo "============================================"
echo "  日本内容审核系统已启动"
echo "  前端: http://localhost:$FRONTEND_PORT"
echo "  后端: http://localhost:$BACKEND_PORT/docs"
echo "  按 Ctrl+C 停止所有服务"
echo "============================================"
echo ""

# ---- Ctrl+C 信号处理 ----
trap 'stop_all; exit 0' INT TERM

# ---- 等待子进程 ----
wait
