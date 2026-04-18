from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://ollama:ollama_password@localhost:5432/ollama_chat"
    
    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin_password"
    minio_bucket: str = "ollama-chat"
    
    # Ollama
    ollama_host: str = "http://localhost:11434"
    
    # Docker sandbox
    sandbox_network: str = "sandbox_network"
    
    # Application
    app_name: str = "Ollama Chat"
    debug: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()
