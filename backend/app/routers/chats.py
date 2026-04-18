from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
import uuid
from datetime import datetime
import json

from ..core.database import get_db
from ..models.schemas import Chat, Message, Document, ChatFile, CodeExecution, Report
from ..services.ollama_service import ollama_service
from ..services.minio_service import minio_service
from ..services.document_processor import document_processor
from ..services.sandbox_service import sandbox_service
from pydantic import BaseModel


router = APIRouter(prefix="/api/chats", tags=["chats"])


class ChatCreate(BaseModel):
    name: str
    chat_type: str = "free"  # free, file_aware, code_interpreter
    model_name: str = "llama3.2"


class ChatMessage(BaseModel):
    content: str
    role: str = "user"


@router.post("")
async def create_chat(chat_data: ChatCreate, db: Session = Depends(get_db)):
    """Create a new chat session"""
    chat = Chat(
        name=chat_data.name,
        chat_type=chat_data.chat_type,
        model_name=chat_data.model_name
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return {
        "id": str(chat.id),
        "name": chat.name,
        "chat_type": chat.chat_type,
        "model_name": chat.model_name,
        "created_at": chat.created_at.isoformat()
    }


@router.get("")
async def list_chats(db: Session = Depends(get_db)):
    """List all chats"""
    result = db.execute(select(Chat).order_by(Chat.updated_at.desc()))
    chats = result.scalars().all()
    
    return [
        {
            "id": str(chat.id),
            "name": chat.name,
            "chat_type": chat.chat_type,
            "model_name": chat.model_name,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat()
        }
        for chat in chats
    ]


@router.get("/{chat_id}")
async def get_chat(chat_id: str, db: Session = Depends(get_db)):
    """Get a specific chat with its messages"""
    result = db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages_result = db.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())
    )
    messages = messages_result.scalars().all()
    
    files_result = db.execute(select(ChatFile).where(ChatFile.chat_id == chat_id))
    files = files_result.scalars().all()
    
    return {
        "id": str(chat.id),
        "name": chat.name,
        "chat_type": chat.chat_type,
        "model_name": chat.model_name,
        "messages": [
            {
                "id": str(msg.id),
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ],
        "files": [
            {
                "id": str(f.id),
                "filename": f.filename,
                "uploaded_at": f.uploaded_at.isoformat()
            }
            for f in files
        ]
    }


@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, db: Session = Depends(get_db)):
    """Delete a chat"""
    result = db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    db.delete(chat)
    db.commit()
    
    return {"message": "Chat deleted successfully"}


@router.post("/{chat_id}/messages")
async def send_message(
    chat_id: str,
    message_data: ChatMessage,
    db: Session = Depends(get_db)
):
    """Send a message to a chat and get response"""
    # Verify chat exists
    result = db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Save user message
    user_message = Message(
        chat_id=chat_id,
        role="user",
        content=message_data.content
    )
    db.add(user_message)
    db.commit()
    
    # Get conversation history
    messages_result = db.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.created_at.asc())
    )
    messages = messages_result.scalars().all()
    
    # Format messages for Ollama
    ollama_messages = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]
    
    # If file-aware chat, get relevant documents
    context = ""
    if chat.chat_type == "file_aware":
        files_result = db.execute(select(ChatFile).where(ChatFile.chat_id == chat_id))
        files = files_result.scalars().all()
        
        for chat_file in files:
            if chat_file.document_id:
                doc_result = db.execute(
                    select(Document).where(Document.id == chat_file.document_id)
                )
                doc = doc_result.scalar_one_or_none()
                if doc and doc.content_text:
                    context += f"\n\n--- Content from {chat_file.filename} ---\n{doc.content_text[:2000]}"
        
        if context:
            system_prompt = f"You are a helpful assistant that answers questions based on the provided documents.{context}"
            ollama_messages.insert(0, {"role": "system", "content": system_prompt})
    
    # Generate response
    assistant_content = ""
    async for chunk in ollama_service.chat(chat.model_name, ollama_messages):
        assistant_content += chunk
    
    # Save assistant message
    assistant_message = Message(
        chat_id=chat_id,
        role="assistant",
        content=assistant_content
    )
    db.add(assistant_message)
    
    # Update chat timestamp
    chat.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(assistant_message)
    
    return {
        "id": str(assistant_message.id),
        "role": "assistant",
        "content": assistant_content,
        "created_at": assistant_message.created_at.isoformat()
    }


@router.post("/{chat_id}/upload")
async def upload_files(
    chat_id: str,
    files: List[UploadFile],
    db: Session = Depends(get_db)
):
    """Upload files to a chat for RAG"""
    chat_result = db.execute(select(Chat).where(Chat.id == chat_id))
    chat = chat_result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    uploaded_files = []
    
    for file in files:
        file_bytes = await file.read()
        file_size = len(file_bytes)
        
        # Upload to MinIO
        object_name = f"{chat_id}/{uuid.uuid4()}_{file.filename}"
        minio_service.upload_file(object_name, file_bytes, file.content_type or "application/octet-stream")
        
        # Process document
        content_text = document_processor.process_document(file_bytes, file.filename)
        file_type = document_processor.get_file_type(file.filename)
        
        # Create document record
        document = Document(
            filename=file.filename,
            file_type=file_type,
            file_path=object_name,
            file_size=file_size,
            content_text=content_text[:10000]  # Store first 10k chars
        )
        db.add(document)
        db.flush()
        
        # Create chat file link
        chat_file = ChatFile(
            chat_id=chat_id,
            document_id=document.id,
            filename=file.filename
        )
        db.add(chat_file)
        
        uploaded_files.append({
            "id": str(chat_file.id),
            "filename": file.filename,
            "file_type": file_type
        })
    
    db.commit()
    
    return {"files": uploaded_files}


@router.post("/{chat_id}/code")
async def execute_code(
    chat_id: str,
    code: str,
    db: Session = Depends(get_db)
):
    """Execute code in sandbox"""
    chat_result = db.execute(select(Chat).where(Chat.id == chat_id))
    chat = chat_result.scalar_one_or_none()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Create code execution record
    execution = CodeExecution(
        chat_id=chat_id,
        code=code,
        status="running"
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    # Execute in sandbox
    result = await sandbox_service.execute_with_artifacts(code, str(chat_id))
    
    # Update execution record
    execution.output = result.get("output", "")
    execution.error = result.get("error")
    execution.artifacts = result.get("artifacts", [])
    execution.status = "completed" if result.get("success") else "failed"
    execution.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "id": str(execution.id),
        "status": execution.status,
        "output": execution.output,
        "error": execution.error,
        "artifacts": execution.artifacts
    }
