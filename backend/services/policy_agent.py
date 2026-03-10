import logging
from pathlib import Path

from config import settings
from services.bedrock_client import bedrock
from utils.json_parser import parse_llm_json

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (Path(__file__).resolve().parent.parent / "prompts" / "policy_agent_system.txt").read_text()


def generate_policy(industry: str, content_types: list[str], additional_requirements: str = "") -> dict:
    """使用策略 Agent（Nova Pro）生成内容审核策略。"""
    user_msg = (
        f"请根据以下条件生成内容审核策略。\n\n"
        f"行业: {industry}\n"
        f"目标内容类型: {', '.join(content_types)}\n"
    )
    if additional_requirements:
        user_msg += f"附加要求:\n{additional_requirements}\n"

    raw = bedrock.converse_text(
        model_id=settings.policy_model_id,
        system_prompt=_SYSTEM_PROMPT,
        user_message=user_msg,
        max_tokens=4096,
        temperature=0.4,
    )
    logger.info("策略 Agent 原始响应长度: %d", len(raw))
    return parse_llm_json(raw)
