from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from pgvector.sqlalchemy import Vector
from ..core.database import Base


class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    chat_type = Column(String(50), nullable=False)  # 'free', 'file_aware', 'code_interpreter'
    model_name = Column(String(100), default="llama3.2")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    files = relationship("ChatFile", back_populates="chat", cascade="all, delete-orphan")
    code_executions = relationship("CodeExecution", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # 'pdf', 'docx', 'txt', 'md', 'csv', 'xlsx', 'json'
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_text = Column(Text)
    embedding = Column(Vector(768))  # Using 768 dimensions for nomic-embed-text
    chunk_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat_files = relationship("ChatFile", back_populates="document")


class ChatFile(Base):
    __tablename__ = "chat_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="files")
    document = relationship("Document", back_populates="chat_files")


class CodeExecution(Base):
    __tablename__ = "code_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    code = Column(Text, nullable=False)
    output = Column(Text)
    error = Column(Text)
    artifacts = Column(JSON, default=list)  # List of generated files/charts
    status = Column(String(50), default="pending")  # 'pending', 'running', 'completed', 'failed'
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    chat = relationship("Chat", back_populates="code_executions")


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=True)
    title = Column(String(255), nullable=False)
    format = Column(String(50), nullable=False)  # 'pdf', 'docx', 'xlsx', 'pptx', 'html', 'md'
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat")
