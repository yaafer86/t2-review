from pypdf import PdfReader
from docx import Document as DocxDocument
import pandas as pd
import json
import markdown
from typing import List, Dict
import io


class DocumentProcessor:
    """Process various document types for RAG"""

    SUPPORTED_TYPES = {
        '.pdf': 'pdf',
        '.docx': 'docx',
        '.txt': 'txt',
        '.md': 'md',
        '.csv': 'csv',
        '.xlsx': 'xlsx',
        '.json': 'json'
    }

    @staticmethod
    def get_file_type(filename: str) -> str:
        """Get file type from filename extension"""
        ext = filename.lower().split('.')[-1]
        return DocumentProcessor.SUPPORTED_TYPES.get(f'.{ext}', 'txt')

    @staticmethod
    def process_pdf(file_bytes: bytes) -> str:
        """Extract text from PDF"""
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
        return text

    @staticmethod
    def process_docx(file_bytes: bytes) -> str:
        """Extract text from DOCX"""
        doc = DocxDocument(io.BytesIO(file_bytes))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text

    @staticmethod
    def process_txt(file_bytes: bytes) -> str:
        """Read plain text file"""
        return file_bytes.decode('utf-8', errors='ignore')

    @staticmethod
    def process_md(file_bytes: bytes) -> str:
        """Read markdown file"""
        return file_bytes.decode('utf-8', errors='ignore')

    @staticmethod
    def process_csv(file_bytes: bytes) -> str:
        """Process CSV and return as formatted text"""
        df = pd.read_csv(io.BytesIO(file_bytes))
        return df.to_string()

    @staticmethod
    def process_xlsx(file_bytes: bytes) -> str:
        """Process XLSX and return as formatted text"""
        excel_file = pd.ExcelFile(io.BytesIO(file_bytes))
        text = ""
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            text += f"\n=== Sheet: {sheet_name} ===\n"
            text += df.to_string() + "\n"
        return text

    @staticmethod
    def process_json(file_bytes: bytes) -> str:
        """Process JSON file"""
        data = json.loads(file_bytes.decode('utf-8'))
        return json.dumps(data, indent=2)

    @classmethod
    def process_document(cls, file_bytes: bytes, filename: str) -> str:
        """Process document based on its type"""
        file_type = cls.get_file_type(filename)
        
        processors = {
            'pdf': cls.process_pdf,
            'docx': cls.process_docx,
            'txt': cls.process_txt,
            'md': cls.process_md,
            'csv': cls.process_csv,
            'xlsx': cls.process_xlsx,
            'json': cls.process_json
        }
        
        processor = processors.get(file_type, cls.process_txt)
        return processor(file_bytes)

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                if last_period > chunk_size // 2:
                    chunk = chunk[:last_period + 1]
                    end = start + last_period + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
        
        return chunks


document_processor = DocumentProcessor()
