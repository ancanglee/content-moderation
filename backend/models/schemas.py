from datetime import datetime

from pydantic import BaseModel


# --- 策略 ---
class PolicyGenerateRequest(BaseModel):
    industry: str = "通用"
    content_types: list[str] = ["图片", "视频"]
    additional_requirements: str = ""


class PolicyCreateRequest(BaseModel):
    name: str
    description: str = ""
    rules: dict


class PolicyUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    rules: dict | None = None


class PolicyResponse(BaseModel):
    id: int
    name: str
    description: str
    rules: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- 审核 ---
class ModerationRequest(BaseModel):
    policy_id: int | None = None


class ModerationResult(BaseModel):
    verdict: str  # "PASS"（通过）, "FAIL"（不通过）, "REVIEW"（需人工复核）
    confidence: float
    categories: list[dict]  # [{"category": "类别", "severity": "严重度", "detail": "详情"}]
    summary: str
    raw_response: str = ""


class ModerationRecordResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    policy_id: int | None
    result: dict
    status: str
    batch_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- 批量处理 ---
class BatchRequest(BaseModel):
    s3_bucket: str
    s3_prefix: str
    policy_id: int | None = None


class BatchStatusResponse(BaseModel):
    id: str
    s3_prefix: str
    policy_id: int | None
    total_files: int
    processed_files: int
    status: str
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
