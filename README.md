# BookTranslator

A sophisticated book translation system that generates gradual bilingual texts for language learning. The system creates 7 progressive levels from pure English to pure German, with each level introducing more target language vocabulary and grammar structures.

---

## ⚡ Quick Start

**New here?** Check out the [**QUICKSTART.md**](QUICKSTART.md) guide for a 5-minute setup!

Already have the project? Run this to test:
```bash
cd aligner && uvicorn app:app --port 8000 &
cd node && npm test
```

---

## 📖 Overview

This project transforms parallel texts (English and German) in **PDF or EPUB format** into hybrid learning materials where:
- **Level 1**: ~5% German (vocabulary seed)
- **Level 2**: ~10% German (mixed lexicon)
- **Level 3**: ~20% German (syntax drift begins)
- **Level 4**: ~50% German (structural balance)
- **Level 5**: ~75% German (dominant target language)
- **Level 6**: ~93% German (minimal scaffolding)
- **Level 7**: 100% German (original translation)

## 🏗️ Architecture

```
project/
├── aligner/              # Python FastAPI service for text alignment
│   ├── app.py           # Main alignment API
│   ├── requirements.txt
│   └── README.md
├── node/                # Node.js orchestrator for generation & PDF output
│   ├── index.js         # Main orchestration script
│   ├── package.json
│   └── README.md
├── data/                # Input files (PDF or EPUB)
│   ├── english.pdf      # Source text (or .epub)
│   └── german.pdf       # Target translation (or .epub)
├── output/              # Generated hybrid PDFs
│   ├── level_1.pdf
│   ├── level_2.pdf
│   ├── ...
│   └── level_7.pdf
├── spec.json            # Translation specification
├── .env                 # Environment configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **OpenAI API Key** (for GPT-4)

### 1. Clone and Setup

```bash
cd /workspaces/BookTranslator
```

### 2. Install Python Dependencies

```bash
cd aligner
pip install -r requirements.txt

# Install a-studio from GitHub
pip install git+https://github.com/averkij/a-studio.git

cd ..
```

**Important**: After installing a-studio, check its documentation to verify the CLI/API interface. You may need to adjust `aligner/app.py` based on the actual a-studio implementation.

### 3. Install Node.js Dependencies

```bash
cd node
npm install
cd ..
```

### 4. Configure Environment

Edit `.env` in the project root:

```bash
OPENAI_API_KEY=your_actual_openai_api_key_here
ALIGNER_URL=http://localhost:8000/align/files
OPENAI_MODEL=gpt-4
```

### 5. Prepare Input Files

Place your files in the `data/` directory. You can use either format:

**Option 1: PDF files**
- `data/english.pdf` - English source text
- `data/german.pdf` - German translation (must be content-aligned)

**Option 2: EPUB files**
- `data/english.epub` - English source text
- `data/german.epub` - German translation (must be content-aligned)

The system will auto-detect which format you're using.

### 6. Start the Alignment Service

In one terminal:

```bash
cd aligner
uvicorn app:app --host 0.0.0.0 --port 8000
```

The service should start and be available at `http://localhost:8000`

### 7. Run the Translation Pipeline

In another terminal:

```bash
cd node
npm start
```

This will:
1. Call the Python alignment service to align the PDFs
2. Generate hybrid texts for levels 1-6 using OpenAI
3. Write 7 PDF files to the `output/` directory

## 📊 How It Works

### Step 1: Text Alignment

The Python service (`aligner/app.py`):
1. Extracts text from both files (PDF or EPUB) using `pdfplumber` or `ebooklib`
2. Runs [a-studio](https://github.com/averkij/a-studio) alignment
3. Returns aligned segments in normalized format

### Step 2: Hybrid Text Generation

The Node.js orchestrator (`node/index.js`):
1. Fetches aligned segments from Python service
2. For each segment and each level (1-6):
   - Builds a prompt with level rules and alignment data
   - Calls OpenAI API to generate hybrid text
   - Tracks introduced German vocabulary for glossing
3. Level 7 uses the original German text

### Step 3: PDF Output

The orchestrator writes 7 PDF files with proper formatting, including:
- Title page with level information
- Formatted content with appropriate line spacing
- Automatic page breaks

## 🔧 Customization

### Modify Translation Rules

Edit `spec.json` to adjust:
- Target L2 ratios for each level
- Vocabulary introduction rates
- Syntactic transformation rules
- Glossing behavior

### Adjust Processing

Edit `node/index.js` to:
- Change the OpenAI model
- Modify prompt templates
- Adjust PDF styling
- Add progress tracking
- Implement caching for large documents

### Alternative File Extraction

**For PDFs:** If `pdfplumber` doesn't work well with your PDFs, edit `aligner/app.py` to use `pymupdf`:

```python
import fitz  # pymupdf

def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text
```

**For EPUBs:** The default extraction uses `ebooklib` with BeautifulSoup for HTML parsing. This works for most standard EPUB files.

## 📝 a-studio Integration

This project uses [a-studio](https://github.com/averkij/a-studio) for text alignment. After installation, you may need to adapt the integration:

### If a-studio provides a CLI:

The current implementation in `aligner/app.py` assumes a CLI interface:

```bash
a-studio align en.txt de.txt -o aligned.json
```

### If a-studio provides a Python API:

Replace `run_a_studio_cli()` with `run_a_studio_python()` in `aligner/app.py` and implement based on the library's API.

### Custom Normalization

If a-studio returns a different output format, adjust the `normalize_a_studio_output()` function to convert it to:

```json
{
  "segments": [
    {"en": "...", "de": "...", "alignment": {}},
    ...
  ]
}
```

## ⚠️ Troubleshooting

### File Extraction Issues

**PDFs:**
- Ensure PDFs have selectable text (not scanned images)
- Try `pymupdf` instead of `pdfplumber`
- Remove headers/footers/page numbers if they interfere

**EPUBs:**
- Verify EPUB is valid using EPUBCheck
- Check for DRM protection (cannot be processed)
- Try converting with Calibre to standard EPUB format

### Alignment Quality
- Verify both files contain the same content (same book, chapters)
- Check segment boundaries in alignment output
- Consider pre-processing texts for better alignment
- Try the other format (EPUB vs PDF) if one doesn't work well

### OpenAI Rate Limits
- Increase delay between API calls in `node/index.js`
- Use a higher-tier API key
- Process in smaller batches

### a-studio Installation
- Check the a-studio repository for updated installation instructions
- Verify dependencies are installed
- Test alignment on small sample texts first

## 📄 Output Example

**Level 1 (~5% German):**
> The boy lived with his aunt and uncle at number four, Privet Drive. They had a small Haus (house) with a garten (garden) in the back.

**Level 4 (~50% German):**
> Der Junge lived mit seiner Tante and Onkel at Nummer vier, Ligusterweg. Sie hatten a kleines Haus with a Garten in the zurück.

**Level 7 (100% German):**
> Der Junge lebte mit seiner Tante und seinem Onkel im Ligusterweg Nummer vier. Sie hatten ein kleines Haus mit einem Garten hinten.

## 📚 Project Structure Details

### Python Service (`aligner/`)
- FastAPI REST API
- PDF text extraction
- a-studio integration
- Output normalization
- See `aligner/README.md` for details

### Node.js Orchestrator (`node/`)
- Pipeline orchestration
- OpenAI API integration
- Vocabulary tracking
- PDF generation
- See `node/README.md` for details

## 🔐 Security Notes

- Never commit your `.env` file with API keys
- Keep your OpenAI API key secure
- Be mindful of API usage costs when processing large books

## 📖 Specification

The translation behavior is fully specified in `spec.json`, which defines:
- 7 progressive levels with target L2 ratios
- Global rules for alignment and vocabulary introduction
- Level-specific rules for syntax, glossing, and replacement
- Progression multipliers for gradual difficulty increase

This specification is passed to the OpenAI model to guide text generation.

## 🎯 Acceptance Criteria

✅ Python alignment service runs on port 8000  
✅ Node.js orchestrator successfully calls Python service  
✅ Aligned segments are received and processed  
✅ OpenAI generates hybrid text for each segment and level  
✅ 7 PDF files are written to `output/` directory  
✅ Level 1 shows mostly English with first-use glosses  
✅ Progression from Level 3 to 4 is gradual and coherent  
✅ Level 7 matches the German PDF content  

## 🤝 Contributing

This is a learning-focused project. To contribute:
1. Test with different language pairs
2. Improve alignment accuracy
3. Enhance PDF formatting
4. Add progress tracking and caching
5. Optimize for large documents

## 📄 License

MIT

---

**Happy Language Learning! 📚🌍**