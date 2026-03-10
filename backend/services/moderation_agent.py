import json
import logging
from pathlib import Path

from config import settings
from services.bedrock_client import bedrock
from utils.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
_IMAGE_SYSTEM = (_PROMPTS_DIR / "moderation_image_system.txt").read_text()
_VIDEO_SYSTEM = (_PROMPTS_DIR / "moderation_video_system.txt").read_text()


def _build_system_prompt(template: str, policy: dict | None) -> str:
    if policy and policy.get("categories"):
        override = "请额外应用以下自定义策略:\n" + json.dumps(
            policy, ensure_ascii=False, indent=2
        )
    else:
        override = "无额外策略。请使用默认类别进行审查。"
    return template.replace("{policy_override}", override)


def moderate_image(image_bytes: bytes, media_type: str, policy: dict | None = None) -> dict:
    """使用 Nova Premier 审核单张图片。"""
    system = _build_system_prompt(_IMAGE_SYSTEM, policy)
    raw = bedrock.converse_image(
        model_id=settings.moderation_model_id,
        system_prompt=system,
        user_text="请审查这张图片。",
        image_bytes=image_bytes,
        media_type=media_type,
    )
    result = parse_llm_json(raw)
    result["raw_response"] = raw
    return result


def moderate_video_s3(s3_uri: str, policy: dict | None = None) -> dict:
    """使用 Nova Premier 通过 S3 URI 审核视频。"""
    system = _build_system_prompt(_VIDEO_SYSTEM, policy)
    raw = bedrock.converse_video_s3(
        model_id=settings.moderation_model_id,
        system_prompt=system,
        user_text="请审查这段视频。",
        s3_uri=s3_uri,
    )
    result = parse_llm_json(raw)
    result["raw_response"] = raw
    return result
