# Ollama Chat - Agentic AI Platform

A full-stack agentic chat application with code interpreter, file-grounded RAG, and downloadable reports — running entirely on your machine or against Ollama Cloud.

## Features

- **One UI for Multiple Chat Modes**
  - Free Chat: General conversation with Ollama models
  - File-Aware Chat: RAG-powered chat over your documents  
  - Code Interpreter: Execute Python code in Docker sandbox with charts and dashboards

- **Ollama-Powered Throughout**
  - Text generation with various models (llama3.2, mistral, etc.)
  - Vision/reasoning capabilities
  - Embeddings for RAG (nomic-embed-text)
  - Switch between local Ollama and Ollama Cloud from Settings (no restart)

- **Docker-Per-Chat Sandbox**
  - Isolated code execution environment
  - Safe execution of user-provided code
  - Support for generating charts, tables, and artifacts

- **Reports Generation**
  - PDF, DOCX, XLSX, PPTX, HTML, Markdown formats
  - All downloadable directly from the UI

- **RAG Over Multiple File Types**
  - PDF, DOCX, TXT, MD, CSV, XLSX, JSON
  - pgvector-powered semantic search

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Zustand
- **Backend**: FastAPI + Python
- **Database**: PostgreSQL with pgvector
- **Object Storage**: MinIO
- **Orchestration**: Docker Compose

## Quick Start

### Prerequisites

1. **Docker & Docker Compose** installed
2. **Ollama** running locally (optional, can use Ollama Cloud)

### Running the Application

```bash
cd /workspace
docker-compose up -d
```

Access: Frontend http://localhost:3000 | API http://localhost:8000 | Docs http://localhost:8000/docs

## Project Structure

- `backend/` - FastAPI backend with routers, services, models
- `frontend/` - React + TypeScript frontend
- `docker-compose.yml` - Orchestrates all services

See full README in the repository for complete documentation.
