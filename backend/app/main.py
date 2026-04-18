from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .routers import chats_router, reports_router, models_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Ollama Chat API",
    description="Agentic chat with code interpreter, file-grounded RAG, and downloadable reports",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chats_router)
app.include_router(reports_router)
app.include_router(models_router)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Ollama Chat API",
        "docs": "/docs",
        "version": "1.0.0"
    }
