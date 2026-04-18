import docker
from docker.types import Mount
import asyncio
import json
import os
import uuid
from typing import Dict, List, Optional
from ..core.config import settings


class SandboxService:
    """Docker-based sandbox for code execution"""

    def __init__(self):
        self.client = docker.from_env()
        self.sandbox_network = settings.sandbox_network
        self._ensure_network()

    def _ensure_network(self):
        """Ensure sandbox network exists"""
        try:
            self.client.networks.get(self.sandbox_network)
        except docker.errors.NotFound:
            self.client.networks.create(self.sandbox_network, driver='bridge')

    async def execute_code(
        self,
        code: str,
        chat_id: str,
        timeout: int = 60,
        libraries: List[str] = None
    ) -> Dict:
        """Execute Python code in isolated Docker container"""
        
        # Prepare the execution environment
        container_name = f"sandbox_{chat_id}_{uuid.uuid4().hex[:8]}"
        
        # Install additional libraries if needed
        install_cmd = ""
        if libraries:
            install_cmd = f"pip install {' '.join(libraries)} && "
        
        # Escape the code for shell execution
        escaped_code = code.replace("'", "'\"'\"'")
        
        # Command to run in container
        cmd = f"""bash -c '{install_cmd}python3 -c \'{escaped_code}\''"""
        
        try:
            # Run container
            container = self.client.containers.run(
                "python:3.11-slim",
                command=cmd,
                name=container_name,
                network=self.sandbox_network,
                remove=True,
                detach=False,
                stdout=True,
                stderr=True,
                mem_limit="512m",
                cpu_quota=50000,
                working_dir="/workspace",
                volumes={
                    '/tmp/sandbox_data': {'bind': '/workspace', 'mode': 'rw'}
                } if os.path.exists('/tmp/sandbox_data') else {}
            )
            
            output = container.decode('utf-8')
            
            return {
                "success": True,
                "output": output,
                "error": None,
                "artifacts": []
            }
            
        except docker.errors.ContainerError as e:
            return {
                "success": False,
                "output": e.stdout.decode('utf-8') if e.stdout else "",
                "error": e.stderr.decode('utf-8') if e.stderr else str(e),
                "artifacts": []
            }
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "artifacts": []
            }

    async def execute_with_artifacts(
        self,
        code: str,
        chat_id: str,
        timeout: int = 60
    ) -> Dict:
        """Execute code that may generate artifacts (charts, files)"""
        
        container_name = f"sandbox_{chat_id}_{uuid.uuid4().hex[:8]}"
        artifact_dir = f"/tmp/sandbox_artifacts/{chat_id}"
        os.makedirs(artifact_dir, exist_ok=True)
        
        escaped_code = code.replace("'", "'\"'\"'")
        
        cmd = f"""bash -c 'python3 << EOF
{code}
EOF'"""
        
        try:
            container = self.client.containers.run(
                "python:3.11-slim",
                command=["bash", "-c", cmd],
                name=container_name,
                network=self.sandbox_network,
                remove=True,
                detach=False,
                stdout=True,
                stderr=True,
                mem_limit="512m",
                cpu_quota=50000,
                working_dir="/workspace",
                volumes={
                    artifact_dir: {'bind': '/workspace/artifacts', 'mode': 'rw'}
                }
            )
            
            output = container.decode('utf-8')
            
            # Check for generated artifacts
            artifacts = []
            if os.path.exists(artifact_dir):
                for filename in os.listdir(artifact_dir):
                    artifacts.append({
                        "filename": filename,
                        "path": os.path.join(artifact_dir, filename)
                    })
            
            return {
                "success": True,
                "output": output,
                "error": None,
                "artifacts": artifacts
            }
            
        except Exception as e:
            return {
                "success": False,
                "output": "",
                "error": str(e),
                "artifacts": []
            }


sandbox_service = SandboxService()
