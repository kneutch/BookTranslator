# Text Alignment Service

Python FastAPI service for aligning English and German texts using [a-studio](https://github.com/averkij/a-studio).

Supports multiple input formats:
- **PDF files** (extracted using pdfplumber)
- **EPUB files** (extracted using ebooklib)
- **Plain text**

## Setup

### 1. Install Python Dependencies

```bash
cd aligner
pip install -r requirements.txt
```

### 2. Install a-studio

a-studio may not be available on PyPI, so install it directly from GitHub:

```bash
pip install git+https://github.com/averkij/a-studio.git
```

**Important:** After installing a-studio, check its documentation to understand:
- Whether it provides a CLI command or Python API
- The exact command syntax or API usage
- Input/output formats

You may need to adjust `app.py` based on the actual a-studio interface.

### 3. Verify Installation

Check if a-studio is available:

```bash
# If it's a CLI tool:
a-studio --help

# If it's a Python library:
python -c "import astudio; print(astudio.__version__)"
```

## Running the Service

Start the FastAPI server:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

Or run directly:

```bash
python app.py
```

The service will be available at `http://localhost:8000`

## API Endpoints

### `GET /`
Health check endpoint.

### `POST /align/pdfs`
Align two PDF files.

**Request body:**
```json
{
  "english_pdf_path": "/path/to/english.pdf",
  "german_pdf_path": "/path/to/german.pdf"
}
```

### `POST /align/epubs`
Align two EPUB files.

**Request body:**
```json
{
  "english_epub_path": "/path/to/english.epub",
  "german_epub_path": "/path/to/german.epub"
}
```

### `POST /align/files`
Auto-detect format and align two files (PDF or EPUB).

**Request body:**
```json
{
  "english_file_path": "/path/to/english.pdf",
  "german_file_path": "/path/to/german.epub"
}
```

### `POST /align/text`
Align two text strings.

**Request body:**
```json
{
  "english_text": "Full English text...",
  "german_text": "Full German text..."
}
```

**Response (all endpoints):**
```json
{
  "segments": [
    {
      "en": "Mr and Mrs Dursley, of number four, Privet Drive...",
      "de": "Mr und Mrs Dursley im Ligusterweg Nummer 4...",
      "alignment": {}
    }
  ]
}
```

## Adapting to a-studio

The current implementation assumes a-studio has a CLI interface. You may need to modify `app.py` based on the actual a-studio implementation:

### If a-studio provides a Python API:

Replace the `run_a_studio_cli()` function with `run_a_studio_python()` and implement it based on the library's API.

### If a-studio outputs a different format:

Adjust the `normalize_a_studio_output()` function to handle the actual output format.

## Troubleshooting

### a-studio not found
- Ensure a-studio is properly installed
- Check if it requires additional dependencies
- Verify the installation with `pip list | grep studio`

### PDF extraction fails
- Try using `pymupdf` instead of `pdfplumber` for better compatibility
- Check if the PDF has selectable text (not scanned images)
- Try EPUB format if available

### EPUB extraction fails
- Verify the EPUB is valid using EPUBCheck
- Check for DRM protection (cannot be processed)
- Try opening in Calibre first to verify content
- Convert to standard EPUB format using Calibre

### Alignment quality issues
- Ensure input PDFs have matching content (same book, same chapters)
- Check a-studio documentation for alignment parameters
- Consider pre-processing texts (removing headers, page numbers, etc.)
