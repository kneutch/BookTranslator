# BookTranslator Quick Start Guide

Get up and running with BookTranslator in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Check Prerequisites

```bash
python3 --version  # Should be 3.10+
node --version     # Should be 18+
```

### 2. Install Dependencies

```bash
# Python dependencies
cd aligner
pip install -r requirements.txt
cd ..

# Node.js dependencies
cd node
npm install
cd ..
```

### 3. Verify Input Files

Your input files are already in place:
```bash
ls -lh data/
# english.epub (44M)
# german.pdf (20M)
```

These are English and German versions of Don Quixote, ready to use!

## 🧪 Test Without OpenAI (1 minute)

Test that the alignment service works without needing an OpenAI API key.

### Terminal 1: Start Alignment Service

```bash
cd aligner
uvicorn app:app --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Started server process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: Run Test

```bash
cd node
npm test
```

You should see:
```
✅ Found english.epub
✅ Found german.pdf
✅ Alignment successful!
✨ Test passed!
```

**Success!** ✨ The alignment service is working. Press Ctrl+C in Terminal 1 to stop the service.

## 🔑 Full Pipeline Setup (Optional)

To generate the complete bilingual PDFs with OpenAI integration:

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Update .env File

Edit `.env` in the project root:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4
ALIGNER_URL=http://localhost:8000/align/files
```

### 3. Run the Full Pipeline

**⚠️ Warning**: This will make thousands of API calls and may cost $20-50!

Terminal 1 (if not already running):
```bash
cd aligner
uvicorn app:app --host 0.0.0.0 --port 8000
```

Terminal 2:
```bash
cd node
npm start
```

The pipeline will:
1. Extract and align text from your input files
2. Generate 6 hybrid text versions using OpenAI
3. Create 7 PDF files in the `output/` directory

This may take 20-60 minutes for a full book!

## 📊 Understanding the Output

After running `npm start`, check the `output/` directory:

```bash
ls -lh output/
```

You'll find 7 PDF files:

| File | Description | L2 Ratio |
|------|-------------|----------|
| `level_1.pdf` | Mostly English, basic German nouns | ~5% German |
| `level_2.pdf` | English with more German vocabulary | ~10% German |
| `level_3.pdf` | English structure, German vocabulary grows | ~20% German |
| `level_4.pdf` | Balanced bilingual text | ~50% German |
| `level_5.pdf` | Mostly German with some English scaffolding | ~75% German |
| `level_6.pdf` | Nearly all German | ~93% German |
| `level_7.pdf` | Pure German (original translation) | 100% German |

### Example Progression

**Level 1 (~5% German)**:
> The boy lived with his aunt and uncle at number four, Privet Drive. They had a small Haus (house) with a Garten (garden) in the back.

**Level 4 (~50% German)**:
> Der boy lived mit seiner aunt und uncle at Nummer vier, Privet Drive. Sie had ein kleines house mit einem garden in the back.

**Level 7 (100% German)**:
> Der Junge lebte mit seiner Tante und seinem Onkel im Ligusterweg Nummer vier. Sie hatten ein kleines Haus mit einem Garten hinten.

## 🎯 What's Working

✅ **Python alignment service** - Extracts and aligns PDF/EPUB texts  
✅ **Fallback alignment** - Works without a-studio installation  
✅ **Node.js orchestrator** - Ready for OpenAI integration  
✅ **PDF/EPUB support** - Handles both formats automatically  
✅ **Test suite** - Verifies alignment without API costs  

## ⚙️ Current Configuration

### Input Files
- **English**: `data/english.epub` (Don Quixote, Project Gutenberg)
- **German**: `data/german.pdf` (Don Quixote German translation)

### Alignment Method
Currently using **simple paragraph alignment** (fallback method):
- Splits texts by double newlines
- Pairs paragraphs sequentially
- Works for well-structured texts
- **Note**: Installing a-studio would provide better alignment

### API Configuration
- **Model**: GPT-4 (configurable in `.env`)
- **Service**: http://localhost:8000/align/files
- **Delay**: 100ms between API calls (to avoid rate limits)

## 🔧 Customization Options

### Use Different Files

Replace the files in `data/`:
```bash
# Remove current files
rm data/english.epub data/german.pdf

# Add your own files (PDF or EPUB)
cp /path/to/your/english.pdf data/english.pdf
cp /path/to/your/german.epub data/german.epub
```

The system auto-detects the format!

### Change OpenAI Model

Edit `.env`:
```bash
OPENAI_MODEL=gpt-3.5-turbo  # Faster and cheaper
# or
OPENAI_MODEL=gpt-4-turbo    # Better quality
```

### Adjust Translation Rules

Edit `spec.json` to customize:
- Target L2 ratios for each level
- Vocabulary introduction rates
- Syntactic transformation rules
- Glossing behavior

### Modify Processing

Edit `node/index.js` to:
- Add progress tracking
- Implement caching
- Change PDF styling
- Adjust API delays

## 📝 Common Tasks

### Test with Small Sample

Create a test file:
```bash
echo "Hello, world!" > /tmp/en.txt
echo "Hallo, Welt!" > /tmp/de.txt

curl -X POST http://localhost:8000/align/text \
  -H "Content-Type: application/json" \
  -d '{"english_text": "Hello, world!", "german_text": "Hallo, Welt!"}'
```

### Check Service Health

```bash
curl http://localhost:8000/
```

Should return:
```json
{
  "service": "Text Alignment Service",
  "status": "running",
  "version": "1.0.0"
}
```

### Stop the Service

Press `Ctrl+C` in the terminal running uvicorn.

Or from another terminal:
```bash
pkill -f uvicorn
```

## 🐛 Troubleshooting

### "Module not found" errors

```bash
# Python
cd aligner && pip install -r requirements.txt

# Node.js
cd node && npm install
```

### "Connection refused" errors

The alignment service isn't running. Start it:
```bash
cd aligner
uvicorn app:app --host 0.0.0.0 --port 8000
```

### "Port already in use"

Something is already using port 8000:
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Then start the service again
cd aligner && uvicorn app:app --port 8000
```

### Only 1 aligned segment returned

This is normal with the fallback aligner if your texts don't have clear paragraph breaks (double newlines). For better results:
1. Install a-studio (see main README)
2. Pre-process your texts to add paragraph breaks
3. Use different input files with better structure

### OpenAI API errors

**Rate limit**: Add delays in `node/index.js` (increase from 100ms)  
**Invalid key**: Check `.env` file for correct API key  
**No access**: Try `gpt-3.5-turbo` instead of `gpt-4`  

## 📚 More Information

- **Full Documentation**: See [README.md](README.md)
- **Testing Guide**: See [TESTING.md](TESTING.md)
- **EPUB Support**: See [EPUB_SUPPORT.md](EPUB_SUPPORT.md)
- **Setup Details**: See [SETUP_SUMMARY.md](SETUP_SUMMARY.md)

## 🎓 Next Steps

Now that you have BookTranslator running:

1. ✅ **Test with your own books**: Replace the files in `data/`
2. ✅ **Experiment with settings**: Adjust `spec.json` and `.env`
3. ✅ **Install a-studio**: For better alignment (optional)
4. ✅ **Share your results**: Create bilingual learning materials!

## ⚡ TL;DR

```bash
# Install
cd aligner && pip install -r requirements.txt && cd ..
cd node && npm install && cd ..

# Test
cd aligner && uvicorn app:app --port 8000 &
cd node && npm test

# Full pipeline (requires OpenAI API key in .env)
cd node && npm start
```

---

**Happy Language Learning! 📖🌍**
