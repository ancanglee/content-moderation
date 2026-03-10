import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# 清除代理环境变量，确保 boto3 (AWS SDK) 直连 AWS 服务，
# 不受本地代理开关状态影响
for _proxy_var in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY"):
    os.environ.pop(_proxy_var, None)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 确保从 backend 目录运行时可以正确导入包
sys.path.insert(0, str(Path(__file__).resolve().parent))

from models.database import engine
from models.tables import Base
from routers import batch, history, moderation, policy
from websocket.manager import ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建数据库表
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="日本内容审核",
    description="日本市场内容审核 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(policy.router, prefix="/api/policy", tags=["Policy"])
app.include_router(moderation.router, prefix="/api/moderation", tags=["Moderation"])
app.include_router(batch.router, prefix="/api/batch", tags=["Batch"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
