import httpx
from ..core.config import settings
from typing import List, Dict, Any, Optional, AsyncGenerator


class OllamaService:
    def __init__(self):
        self.host = settings.ollama_host
        self.embedding_model = "nomic-embed-text"
        self.chat_models = ["llama3.2", "llama3.1", "mistral", "qwen2.5"]

    async def chat(self, model: str, messages: List[Dict], stream: bool = True) -> AsyncGenerator[str, None]:
        """Stream chat completion from Ollama"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "model": model,
                "messages": messages,
                "stream": stream
            }
            
            async with client.stream(
                "POST",
                f"{self.host}/api/chat",
                json=payload
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        import json
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue

    async def generate_embedding(self, text: str, model: str = None) -> List[float]:
        """Generate embedding for text"""
        model = model or self.embedding_model
        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": model,
                "prompt": text
            }
            response = await client.post(
                f"{self.host}/api/embeddings",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data.get("embedding", [])

    async def list_models(self) -> List[str]:
        """List available models"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{self.host}/api/tags")
            response.raise_for_status()
            data = response.json()
            return [model["name"] for model in data.get("models", [])]

    async def pull_model(self, model: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Pull a model from Ollama library"""
        async with httpx.AsyncClient(timeout=None) as client:
            payload = {"name": model}
            async with client.stream(
                "POST",
                f"{self.host}/api/pull",
                json=payload
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        import json
                        try:
                            data = json.loads(line)
                            yield data
                        except json.JSONDecodeError:
                            continue

    async def vision_chat(self, model: str, messages: List[Dict], images: List[str]) -> AsyncGenerator[str, None]:
        """Chat with vision support (images as base64)"""
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Add images to messages
            for i, image_data in enumerate(images):
                messages.append({
                    "role": "user",
                    "content": f"[Image {i+1}]",
                    "images": [image_data]
                })
            
            payload = {
                "model": model,
                "messages": messages,
                "stream": True
            }
            
            async with client.stream(
                "POST",
                f"{self.host}/api/chat",
                json=payload
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        import json
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue


ollama_service = OllamaService()
