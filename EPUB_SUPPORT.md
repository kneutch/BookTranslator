# EPUB Support - Quick Reference

## ✅ What's New

BookTranslator now supports **EPUB files** in addition to PDFs!

## 📚 Supported Input Formats

- **PDF** (`.pdf`) - Extracted using pdfplumber
- **EPUB** (`.epub`) - Extracted using ebooklib
- **Mixed** - You can even use different formats (e.g., english.pdf + german.epub)

## 🚀 How to Use

### Option 1: EPUB Files Only

Place in `data/` directory:
```
data/english.epub
data/german.epub
```

### Option 2: PDF Files Only

Place in `data/` directory:
```
data/english.pdf
data/german.pdf
```

### Option 3: Mixed Formats

You can mix formats if needed:
```
data/english.epub
data/german.pdf
```

The system will **automatically detect** which format you're using!

## 🔧 What Changed

### Python Service (`aligner/app.py`)

**New Functions:**
- `extract_text_from_epub()` - Extracts text from EPUB files
- `extract_text_from_file()` - Auto-detects format (PDF or EPUB)

**New API Endpoints:**
- `POST /align/epubs` - Align two EPUB files
- `POST /align/files` - Auto-detect and align (recommended)

### Node.js Orchestrator (`node/index.js`)

**New Features:**
- Auto-detection of input file format
- Looks for `.epub` files first, then `.pdf`
- Uses `/align/files` endpoint by default

### Configuration (`.env`)

**Updated:**
```bash
ALIGNER_URL=http://localhost:8000/align/files
```

This endpoint works for both PDF and EPUB!

## 📦 Installation

New Python dependencies are required:

```bash
cd aligner
pip install ebooklib beautifulsoup4 lxml
```

Or use the requirements file:

```bash
pip install -r requirements.txt
```

## 💡 Why EPUB?

**Advantages of EPUB over PDF:**
- Better text structure (chapters, paragraphs)
- No page number interference
- Cleaner text extraction
- Smaller file sizes
- Standardized format

**When to use EPUB:**
- Available from most ebook sources
- Better for narrative content
- Cleaner alignment results

**When to use PDF:**
- Only format available
- Need exact layout preservation
- Academic or technical documents

## 🔍 Finding EPUB Books

### Free Sources:
- **Project Gutenberg**: https://www.gutenberg.org (70,000+ books)
- **Standard Ebooks**: https://standardebooks.org (High-quality classics)
- **Many Books**: https://manybooks.net
- **Open Library**: https://openlibrary.org

### Converting Formats:

Use Calibre to convert between formats:

```bash
# PDF to EPUB
ebook-convert book.pdf book.epub

# EPUB to PDF
ebook-convert book.epub book.pdf
```

## ✅ Quick Test

1. Download an EPUB book from Project Gutenberg
2. Place it in `data/` as `english.epub` and `german.epub`
3. Run the pipeline as normal:

```bash
# Terminal 1
cd aligner && uvicorn app:app --port 8000

# Terminal 2
cd node && npm start
```

The system will detect EPUB format automatically!

## 🐛 Troubleshooting

### "Module 'ebooklib' not found"
```bash
pip install ebooklib beautifulsoup4 lxml
```

### "Cannot extract EPUB"
- Check if EPUB is DRM-protected (remove DRM first)
- Verify EPUB is valid using EPUBCheck
- Try opening in Calibre first

### "No text extracted"
- Some EPUBs use images for text (cannot process)
- Try converting to standard EPUB format using Calibre
- Check if file is corrupted

## 📝 Technical Details

### EPUB Text Extraction

The system:
1. Reads EPUB using `ebooklib`
2. Iterates through all document items (chapters)
3. Parses HTML content with BeautifulSoup
4. Extracts text while preserving paragraph structure
5. Concatenates chapters with double line breaks

### File Type Detection

Priority order:
1. Check for `.epub` extension → use EPUB extractor
2. Check for `.pdf` extension → use PDF extractor
3. Return error for unsupported formats

### API Endpoint Selection

- `/align/files` - **Recommended** (auto-detects format)
- `/align/pdfs` - Explicitly for PDFs only
- `/align/epubs` - Explicitly for EPUBs only
- `/align/text` - For pre-extracted text

---

**EPUB support is fully integrated - just drop in your .epub files and go! 📖**
