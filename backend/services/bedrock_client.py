import base64
import logging
from typing import Any

import boto3
from botocore.config import Config

from config import settings

logger = logging.getLogger(__name__)


class BedrockClient:
    def __init__(self):
        self._client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            config=Config(read_timeout=600, connect_timeout=10, retries={"max_attempts": 2}),
        )

    def converse_text(
        self,
        model_id: str,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> str:
        """通过 Converse API 发送纯文本消息。"""
        response = self._client.converse(
            modelId=model_id,
            system=[{"text": system_prompt}],
            messages=[{"role": "user", "content": [{"text": user_message}]}],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": temperature,
            },
        )
        return self._extract_text(response)

    def converse_image(
        self,
        model_id: str,
        system_prompt: str,
        user_text: str,
        image_bytes: bytes,
        media_type: str,
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> str:
        """通过 Converse API 发送包含内联图片的消息。"""
        # 将常见 MIME 类型映射到 Converse API 格式
        format_map = {
            "image/jpeg": "jpeg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
        }
        img_format = format_map.get(media_type, "jpeg")

        response = self._client.converse(
            modelId=model_id,
            system=[{"text": system_prompt}],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "image": {
                                "format": img_format,
                                "source": {"bytes": image_bytes},
                            }
                        },
                        {"text": user_text},
                    ],
                }
            ],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": temperature,
            },
        )
        return self._extract_text(response)

    def converse_video_s3(
        self,
        model_id: str,
        system_prompt: str,
        user_text: str,
        s3_uri: str,
        max_tokens: int = 4096,
        temperature: float = 0.1,
    ) -> str:
        """通过 Converse API 发送以 S3 URI 引用的视频消息。

        Nova 视频输入仅支持 S3 URI。
        """
        response = self._client.converse(
            modelId=model_id,
            system=[{"text": system_prompt}],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "video": {
                                "format": "mp4",
                                "source": {"s3Location": {"uri": s3_uri}},
                            }
                        },
                        {"text": user_text},
                    ],
                }
            ],
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": temperature,
            },
        )
        return self._extract_text(response)

    @staticmethod
    def _extract_text(response: dict[str, Any]) -> str:
        output = response.get("output", {})
        message = output.get("message", {})
        parts = message.get("content", [])
        texts = [p["text"] for p in parts if "text" in p]
        return "\n".join(texts)


# 模块级单例
bedrock = BedrockClient()
