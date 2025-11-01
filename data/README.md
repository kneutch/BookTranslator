# Input Data Directory

Place your source files here for translation processing.

## Required Files

You need **one of the following combinations**:

### Option 1: PDF Files
- `english.pdf` - Source text in English
- `german.pdf` - Target translation in German

### Option 2: EPUB Files
- `english.epub` - Source text in English
- `german.epub` - Target translation in German

The system will automatically detect which format you're using.

## Requirements

1. **Content Alignment**: Both files should contain the same content (same book, chapters in the same order)
2. **For PDFs**: Must have selectable text, not scanned images
3. **For EPUBs**: Standard EPUB format (EPUB2 or EPUB3)
4. **Clean Formatting**: Remove or standardize:
   - Headers and footers
   - Page numbers (PDF)
   - Table of contents (if not part of main content)
   - Front matter that differs between versions

## File Format Support

The system supports:
- **PDF** (`.pdf`) - Extracted using pdfplumber
- **EPUB** (`.epub`) - Extracted using ebooklib

You can mix formats if needed (e.g., `english.pdf` + `german.epub`), but it's recommended to use the same format for both files.

## Testing with Sample Data

For testing, you can use:
- Public domain books with translations (e.g., from Project Gutenberg)
- Your own translated documents
- Short story collections

### Example Sources

- **Project Gutenberg**: https://www.gutenberg.org (EPUB and PDF)
- **Many Books**: https://manybooks.net (Multiple formats)
- **Open Culture**: https://www.openculture.com/free_ebooks
- **Standard Ebooks**: https://standardebooks.org (High-quality EPUBs)

## File Size Considerations

- Large PDFs (>100 pages) will take longer to process
- Consider testing with a single chapter first
- OpenAI API costs scale with document length

## Preparing Files

### Creating PDFs from text:

```bash
# Using pandoc
pandoc english.txt -o english.pdf
pandoc german.txt -o german.pdf
```

### Converting between formats:

```bash
# PDF to EPUB using Calibre
ebook-convert english.pdf english.epub
ebook-convert german.pdf german.epub

# EPUB to PDF
ebook-convert english.epub english.pdf
```

## Troubleshooting

### PDF Not Processing Correctly

If text extraction fails:
1. Verify the PDF has selectable text (not an image)
2. Try converting to a cleaner PDF format
3. Check for unusual fonts or encoding issues
4. Consider using OCR if text is embedded as images
5. Try EPUB format instead

### EPUB Not Processing Correctly

If text extraction fails:
1. Verify the EPUB is valid (use EPUBCheck)
2. Try opening in Calibre to verify content
3. Some DRM-protected EPUBs cannot be processed
4. Convert to a standard EPUB format using Calibre

### Alignment Issues

If alignment quality is poor:
1. Ensure chapters are in the same order
2. Remove differing front/back matter
3. Check that both versions are complete
4. Pre-process to align paragraph structures
