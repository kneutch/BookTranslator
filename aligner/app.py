"""
FastAPI service for aligning English and German texts using a-studio.
Accepts PDF files, EPUB files, or raw text, extracts content, runs alignment, and returns aligned segments.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pdfplumber
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import tempfile
import json
import subprocess
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Text Alignment Service", version="1.0.0")

# Add CORS middleware to allow requests from Node.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PdfPair(BaseModel):
    english_pdf_path: str
    german_pdf_path: str


class EpubPair(BaseModel):
    english_epub_path: str
    german_epub_path: str


class FilePair(BaseModel):
    """Generic file pair that auto-detects format"""
    english_file_path: str
    german_file_path: str


class TextPair(BaseModel):
    english_text: str
    german_text: str


class AlignmentResponse(BaseModel):
    segments: List[Dict[str, Any]]


def extract_text_from_pdf(path: str) -> str:
    """
    Extract all text from a PDF file using pdfplumber.
    Returns a single string with all pages concatenated.
    """
    try:
        text_parts = []
        logger.info(f"Extracting text from PDF: {path}")
        
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
                else:
                    logger.warning(f"No text extracted from page {i+1}")
        
        full_text = "\n".join(text_parts)
        logger.info(f"Extracted {len(full_text)} characters from {len(text_parts)} pages")
        return full_text
    
    except Exception as e:
        logger.error(f"Error extracting PDF text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")


def extract_text_from_epub(path: str) -> str:
    """
    Extract all text from an EPUB file using ebooklib.
    Returns a single string with all chapters concatenated.
    """
    try:
        text_parts = []
        logger.info(f"Extracting text from EPUB: {path}")
        
        book = epub.read_epub(path)
        
        # Get all items of type document (chapters)
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                # Parse HTML content
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                
                # Extract text from all paragraphs and preserve structure
                text = soup.get_text(separator='\n', strip=True)
                
                if text.strip():
                    text_parts.append(text)
        
        full_text = "\n\n".join(text_parts)
        logger.info(f"Extracted {len(full_text)} characters from {len(text_parts)} chapters")
        return full_text
    
    except Exception as e:
        logger.error(f"Error extracting EPUB text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"EPUB extraction failed: {str(e)}")


def extract_text_from_file(path: str) -> str:
    """
    Auto-detect file type and extract text accordingly.
    Supports PDF and EPUB formats.
    """
    path_lower = path.lower()
    
    if path_lower.endswith('.pdf'):
        return extract_text_from_pdf(path)
    elif path_lower.endswith('.epub'):
        return extract_text_from_epub(path)
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format. Expected .pdf or .epub, got: {path}"
        )


def run_a_studio_cli(en_text: str, de_text: str) -> Dict[str, Any]:
    """
    Run a-studio alignment using its CLI interface.
    Writes temporary files, calls the CLI, and parses the output.
    
    IMPORTANT: This function assumes a-studio is installed and available as a CLI command.
    If a-studio provides a Python API instead, replace this with direct API calls.
    """
    try:
        # Create temporary directory for this alignment operation
        temp_dir = Path(tempfile.mkdtemp())
        en_file = temp_dir / "en.txt"
        de_file = temp_dir / "de.txt"
        out_file = temp_dir / "aligned.json"
        
        # Write input files
        en_file.write_text(en_text, encoding="utf-8")
        de_file.write_text(de_text, encoding="utf-8")
        
        logger.info("Running a-studio alignment...")
        
        # Run a-studio CLI
        # NOTE: Adjust this command based on actual a-studio CLI interface
        # Check the a-studio repository README for the exact command syntax
        cmd = [
            "a-studio",
            "align",
            str(en_file),
            str(de_file),
            "-o",
            str(out_file)
        ]
        
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True
        )
        
        logger.info(f"a-studio output: {result.stdout}")
        
        # Read and parse the alignment output
        if out_file.exists():
            aligned_data = json.loads(out_file.read_text(encoding="utf-8"))
            return normalize_a_studio_output(aligned_data)
        else:
            raise Exception("a-studio did not produce output file")
    
    except subprocess.CalledProcessError as e:
        logger.error(f"a-studio command failed: {e.stderr}")
        raise HTTPException(
            status_code=500,
            detail=f"a-studio alignment failed: {e.stderr}"
        )
    except Exception as e:
        logger.error(f"Alignment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Alignment failed: {str(e)}")


def run_a_studio_python(en_text: str, de_text: str) -> Dict[str, Any]:
    """
    Alternative: Run a-studio alignment using its Python API.
    This should be used if a-studio provides a Python library interface.
    
    TODO: Uncomment and adapt this once you've inspected the a-studio repository.
    """
    try:
        # Example Python API usage (adjust based on actual a-studio API):
        # from astudio import Aligner
        # aligner = Aligner(source_lang="en", target_lang="de")
        # result = aligner.align(en_text, de_text)
        # return normalize_a_studio_output(result)
        
        raise NotImplementedError(
            "Python API not yet implemented. Use CLI version or implement based on a-studio docs."
        )
    except Exception as e:
        logger.error(f"Python API alignment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Alignment failed: {str(e)}")


def normalize_a_studio_output(raw_output: Any) -> Dict[str, Any]:
    """
    Normalize a-studio output into our standard format:
    {
        "segments": [
            {"en": "...", "de": "...", "alignment": {...}},
            ...
        ]
    }
    
    a-studio might return various formats:
    - Paragraph-level alignments
    - Sentence-level alignments
    - Character offset-based alignments
    
    This function should convert any of these into our segment format.
    """
    
    # TODO: Adjust this based on actual a-studio output format
    # For now, we'll handle some common cases
    
    segments = []
    
    # Case 1: a-studio returns a list of aligned pairs
    if isinstance(raw_output, list):
        for item in raw_output:
            if isinstance(item, dict) and "source" in item and "target" in item:
                segments.append({
                    "en": item["source"],
                    "de": item["target"],
                    "alignment": item.get("alignment", {})
                })
            elif isinstance(item, dict) and "en" in item and "de" in item:
                segments.append(item)
    
    # Case 2: a-studio returns a dict with alignments key
    elif isinstance(raw_output, dict):
        if "alignments" in raw_output:
            for item in raw_output["alignments"]:
                segments.append({
                    "en": item.get("source", item.get("en", "")),
                    "de": item.get("target", item.get("de", "")),
                    "alignment": item.get("alignment", {})
                })
        elif "segments" in raw_output:
            segments = raw_output["segments"]
    
    # If we still have no segments, log a warning
    if not segments:
        logger.warning(
            f"Could not normalize a-studio output. Raw format: {type(raw_output)}"
        )
        # Return a minimal valid response
        segments = [{"en": "", "de": "", "alignment": {}}]
    
    logger.info(f"Normalized {len(segments)} aligned segments")
    return {"segments": segments}


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "service": "Text Alignment Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/align/pdfs", response_model=AlignmentResponse)
def align_pdfs(pair: PdfPair):
    """
    Extract text from two PDF files and align them.
    
    Args:
        pair: Object containing paths to English and German PDF files
    
    Returns:
        AlignmentResponse with aligned segments
    """
    logger.info(f"Aligning PDFs: {pair.english_pdf_path} and {pair.german_pdf_path}")
    
    # Extract text from both PDFs
    en_text = extract_text_from_pdf(pair.english_pdf_path)
    de_text = extract_text_from_pdf(pair.german_pdf_path)
    
    # Run alignment
    result = run_a_studio_cli(en_text, de_text)
    return result


@app.post("/align/epubs", response_model=AlignmentResponse)
def align_epubs(pair: EpubPair):
    """
    Extract text from two EPUB files and align them.
    
    Args:
        pair: Object containing paths to English and German EPUB files
    
    Returns:
        AlignmentResponse with aligned segments
    """
    logger.info(f"Aligning EPUBs: {pair.english_epub_path} and {pair.german_epub_path}")
    
    # Extract text from both EPUBs
    en_text = extract_text_from_epub(pair.english_epub_path)
    de_text = extract_text_from_epub(pair.german_epub_path)
    
    # Run alignment
    result = run_a_studio_cli(en_text, de_text)
    return result


@app.post("/align/files", response_model=AlignmentResponse)
def align_files(pair: FilePair):
    """
    Auto-detect file format and align two files (PDF or EPUB).
    
    Args:
        pair: Object containing paths to English and German files
    
    Returns:
        AlignmentResponse with aligned segments
    """
    logger.info(f"Aligning files: {pair.english_file_path} and {pair.german_file_path}")
    
    # Auto-detect and extract text from both files
    en_text = extract_text_from_file(pair.english_file_path)
    de_text = extract_text_from_file(pair.german_file_path)
    
    # Run alignment
    result = run_a_studio_cli(en_text, de_text)
    return result


@app.post("/align/text", response_model=AlignmentResponse)
def align_text(pair: TextPair):
    """
    Align two plain text strings.
    
    Args:
        pair: Object containing English and German text strings
    
    Returns:
        AlignmentResponse with aligned segments
    """
    logger.info(f"Aligning text: {len(pair.english_text)} and {len(pair.german_text)} characters")
    
    # Run alignment
    result = run_a_studio_cli(pair.english_text, pair.german_text)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
