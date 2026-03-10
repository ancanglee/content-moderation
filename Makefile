.PHONY: setup run stop clean

setup:
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
	cd frontend && npm install

# 一条命令启动前后端，Ctrl+C 统一停止
run:
	./run.sh

stop:
	./run.sh stop

clean:
	./run.sh stop 2>/dev/null || true
	rm -rf backend/.venv backend/moderation.db frontend/node_modules
