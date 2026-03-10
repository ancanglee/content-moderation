# 日本内容审核系统

基于 AWS Bedrock Nova 模型的日本市场内容审核应用。支持图片和视频的 AI 自动审核。

## 架构

```
React 前端 (5173) ──HTTP/WS──> FastAPI 后端 (8000)
                                  ├── 策略 Agent ──> Bedrock Nova Pro (文本)
                                  ├── 审核 Agent ──> Bedrock Nova Premier (多模态)
                                  ├── 批量处理器 (asyncio 并发)
                                  ├── WebSocket 管理器 (进度推送)
                                  └── SQLite (记录存储)
```

## 功能

- **内容审核**：上传图片・视频，AI 自动审查并返回结果
- **策略管理**：AI 自动生成审核策略，支持手工编辑审核标准，支持手工触发 Agent 重新生成
- **批量处理**：从 S3 桶批量审核内容，WebSocket 实时推送进度
- **审核历史**：查看历史审核结果，支持按判定・类型筛选，统计概览

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Ant Design 5 |
| 后端 | Python FastAPI + SQLAlchemy (SQLite) |
| AI | AWS Bedrock Nova Pro / Nova Premier |
| 通信 | REST API + WebSocket |

## 安装部署

### 前提条件

- Python 3.11+
- Node.js 20+
- AWS 凭证已配置（`aws configure` 或环境变量）
- 已开通 Bedrock Nova Pro / Premier 模型访问权限

### 安装

```bash
# 自动安装
chmod +x setup.sh
./setup.sh

# 或手动安装
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cd frontend && npm install
```

### 启动

```bash
# 一条命令启动前后端（Ctrl+C 统一停止）
./run.sh

# 或使用 Makefile
make run       # 启动
make stop      # 停止
```

浏览器访问 http://localhost:5173

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| CM_AWS_REGION | us-east-1 | AWS 区域 |
| CM_S3_TEMP_BUCKET | content-moderation-temp | 视频临时上传用 S3 桶 |
| CM_POLICY_MODEL_ID | amazon.nova-pro-v1:0 | 策略生成模型 |
| CM_MODERATION_MODEL_ID | amazon.nova-premier-v1:0 | 内容审核模型 |
| CM_BATCH_CONCURRENCY | 5 | 批量处理并发数 |

## 使用方法

### 1. 策略管理

在「策略管理」页面选择行业和内容类型，点击「AI 生成策略」。生成的策略可以预览后保存。

已保存的策略支持：
- **编辑**：点击「编辑」按钮，可视化修改审核类别、严重度定义、示例和通用指南
- **重新生成**：点击「重新生成」按钮，手工触发 AI Agent 重新调研日本法规并更新策略

### 2. 内容审核

在「内容审核」页面上传图片或视频文件，可选择应用策略，点击「开始审核」。结果分为 PASS（通过）/ FAIL（不通过）/ REVIEW（需人工复核）三级。

### 3. 批量处理

在「批量处理」页面输入 S3 桶名和前缀，启动批量审核。WebSocket 实时推送进度和每个文件的审核结果。

### 4. 审核历史

在「审核历史」页面查看所有审核记录，可按判定结果和文件类型筛选，顶部展示统计摘要。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/policy/ | 策略列表 |
| POST | /api/policy/generate | AI 生成策略 |
| POST | /api/policy/ | 创建策略 |
| PUT | /api/policy/{id} | 更新策略（手工编辑） |
| POST | /api/policy/{id}/regenerate | 触发 Agent 重新生成策略 |
| DELETE | /api/policy/{id} | 删除策略 |
| POST | /api/moderation/upload | 上传文件并审核 |
| POST | /api/batch/start | 启动批量任务 |
| GET | /api/batch/ | 批量任务列表 |
| GET | /api/batch/{id} | 批量任务详情 |
| GET | /api/history/ | 审核历史 |
| GET | /api/history/stats | 审核统计 |
| WS | /ws/batch/{id} | 批量进度 WebSocket |

## 项目结构

```
├── backend/
│   ├── main.py                  # FastAPI 入口
│   ├── config.py                # 配置管理
│   ├── routers/                 # API 路由
│   ├── services/                # 业务逻辑
│   ├── models/                  # 数据库模型 + Pydantic 模式
│   ├── prompts/                 # AI 提示词模板
│   ├── websocket/               # WebSocket 管理
│   └── utils/                   # 工具函数
├── frontend/
│   └── src/
│       ├── api/                 # API 客户端
│       ├── pages/               # 页面组件
│       ├── components/          # 通用组件
│       ├── hooks/               # 自定义 Hook
│       └── types/               # 类型定义
├── run.sh                       # 统一启停脚本
├── Makefile
├── setup.sh
└── README.md
```
