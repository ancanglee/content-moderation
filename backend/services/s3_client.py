import logging

import boto3

from config import settings

logger = logging.getLogger(__name__)

_s3 = boto3.client("s3", region_name=settings.aws_region)

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".mp4",
    ".mov",
    ".mkv",
}


def list_media_files(bucket: str, prefix: str) -> list[dict]:
    """列出 S3 前缀下所有支持的媒体文件。"""
    files: list[dict] = []
    paginator = _s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key: str = obj["Key"]
            ext = "." + key.rsplit(".", 1)[-1].lower() if "." in key else ""
            if ext in SUPPORTED_EXTENSIONS:
                files.append(
                    {
                        "key": key,
                        "size": obj["Size"],
                        "ext": ext,
                        "s3_uri": f"s3://{bucket}/{key}",
                    }
                )
    return files


def download_file_bytes(bucket: str, key: str) -> bytes:
    resp = _s3.get_object(Bucket=bucket, Key=key)
    return resp["Body"].read()


def upload_bytes(bucket: str, key: str, data: bytes, content_type: str = "application/octet-stream"):
    _s3.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)


def upload_to_temp(file_name: str, data: bytes, content_type: str) -> str:
    """上传字节数据到临时 S3 桶并返回 S3 URI。"""
    key = f"tmp/{file_name}"
    upload_bytes(settings.s3_temp_bucket, key, data, content_type)
    return f"s3://{settings.s3_temp_bucket}/{key}"
