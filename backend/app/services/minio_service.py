from minio import Minio
from minio.error import S3Error
from ..core.config import settings
import io


class MinIOService:
    def __init__(self):
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=False
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(settings.minio_bucket):
                self.client.make_bucket(settings.minio_bucket)
        except S3Error as e:
            print(f"Error creating bucket: {e}")

    def upload_file(self, object_name: str, file_data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload file to MinIO and return the object name"""
        try:
            self.client.put_object(
                settings.minio_bucket,
                object_name,
                io.BytesIO(file_data),
                len(file_data),
                content_type=content_type
            )
            return object_name
        except S3Error as e:
            raise Exception(f"Failed to upload file: {e}")

    def download_file(self, object_name: str) -> bytes:
        """Download file from MinIO"""
        try:
            response = self.client.get_object(settings.minio_bucket, object_name)
            return response.read()
        except S3Error as e:
            raise Exception(f"Failed to download file: {e}")

    def delete_file(self, object_name: str):
        """Delete file from MinIO"""
        try:
            self.client.remove_object(settings.minio_bucket, object_name)
        except S3Error as e:
            raise Exception(f"Failed to delete file: {e}")

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        """Get presigned URL for file access"""
        try:
            from datetime import timedelta
            url = self.client.presigned_get_object(
                settings.minio_bucket,
                object_name,
                expires=timedelta(seconds=expires)
            )
            return url
        except S3Error as e:
            raise Exception(f"Failed to get presigned URL: {e}")

    def list_files(self, prefix: str = "") -> list:
        """List files in bucket with optional prefix"""
        try:
            objects = self.client.list_objects(settings.minio_bucket, prefix=prefix, recursive=True)
            return [obj.object_name for obj in objects]
        except S3Error as e:
            raise Exception(f"Failed to list files: {e}")


minio_service = MinIOService()
