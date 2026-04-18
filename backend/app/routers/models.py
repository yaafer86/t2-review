from fastapi import APIRouter, Depends
from sqlalchemy import select
from typing import List

from ..core.database import get_db
from ..services.ollama_service import ollama_service
from pydantic import BaseModel


router = APIRouter(prefix="/api/models", tags=["models"])


class ModelInfo(BaseModel):
    name: str
    type: str  # chat or embedding


@router.get("")
async def list_models(db = Depends(get_db)):
    """List available Ollama models"""
    try:
        models = await ollama_service.list_models()
        return {
            "models": [
                {"name": model, "type": "chat"}
                for model in models
            ],
            "embedding_models": ["nomic-embed-text"]
        }
    except Exception as e:
        return {
            "error": str(e),
            "models": [],
            "embedding_models": []
        }


@router.post("/pull")
async def pull_model(model_name: str):
    """Pull a model from Ollama library"""
    from fastapi.responses import StreamingResponse
    import json
    
    async def generate():
        async for chunk in ollama_service.pull_model(model_name):
            yield json.dumps(chunk) + "\n"
    
    return StreamingResponse(generate(), media_type="application/x-ndjson")
