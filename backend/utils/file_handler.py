ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-matroska"}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_VIDEO_SIZE = 1024 * 1024 * 1024  # 1 GB


def classify_media(content_type: str) -> str:
    """根据 MIME 类型返回 'image' 或 'video'。"""
    if content_type in ALLOWED_IMAGE_TYPES:
        return "image"
    if content_type in ALLOWED_VIDEO_TYPES:
        return "video"
    raise ValueError(f"不支持的内容类型: {content_type}")


def validate_upload(content_type: str, size: int) -> None:
    """如果上传无效则抛出 ValueError。"""
    if content_type not in ALLOWED_TYPES:
        raise ValueError(
            f"不支持的文件类型: {content_type}。"
            f"允许的类型: {', '.join(sorted(ALLOWED_TYPES))}"
        )
    media = classify_media(content_type)
    limit = MAX_IMAGE_SIZE if media == "image" else MAX_VIDEO_SIZE
    if size > limit:
        raise ValueError(
            f"文件过大 ({size / 1024 / 1024:.1f} MB)。"
            f"{media} 最大限制: {limit / 1024 / 1024:.0f} MB"
        )
