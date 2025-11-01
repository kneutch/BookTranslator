# Testing BookTranslator

This document explains how to test the BookTranslator system.

## Quick Test (No OpenAI API Required)

The system includes a test script that verifies the alignment service is working without requiring OpenAI API calls.

### Prerequisites

1. Python alignment service must be running:
   ```bash
   cd aligner
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

2. Input files must be in the `data/` directory:
   - `english.epub` or `english.pdf`
   - `german.epub` or `german.pdf`

### Run the Test

```bash
cd node
npm test
```

This will:
- ✅ Verify input files exist
- ✅ Call the alignment service
- ✅ Display the number of aligned segments
- ✅ Show sample aligned text pairs

### Expected Output

```
🧪 Testing BookTranslator alignment service...

✅ Found english.epub
✅ Found german.pdf

📡 Calling alignment service...
✅ Alignment successful!
   Received X aligned segments

📝 Sample aligned segments:

Segment 1:
  EN: The Project Gutenberg eBook...
  DE: £>tefe$ SBucf) mürbe...

✨ Test passed! The alignment service is working correctly.
```

## Full Pipeline Test (Requires OpenAI API)

To test the complete pipeline with OpenAI integration:

### 1. Set Your API Key

Edit `.env` in the project root:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4
ALIGNER_URL=http://localhost:8000/align/files
```

### 2. Start the Alignment Service

```bash
cd aligner
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 3. Run the Full Pipeline

In another terminal:
```bash
cd node
npm start
```

This will:
1. Extract and align text from both files
2. Generate hybrid texts for levels 1-6 using OpenAI
3. Write 7 PDF files to the `output/` directory

**⚠️ Warning**: The full pipeline may make thousands of OpenAI API calls for large books, which can be expensive!

## Testing with Small Samples

To avoid high costs while testing, you can create small sample files:

### Create Sample Files

```bash
# Create a small English sample
echo "Chapter One

The boy lived with his aunt and uncle.
They had a small house with a garden.
He was not happy there.

Chapter Two

One day, a letter arrived.
It changed everything." > data/english-sample.txt

# Create a small German sample
echo "Erstes Kapitel

Der Junge lebte bei seiner Tante und seinem Onkel.
Sie hatten ein kleines Haus mit einem Garten.
Er war dort nicht glücklich.

Zweites Kapitel

Eines Tages kam ein Brief.
Er veränderte alles." > data/german-sample.txt
```

### Test with Sample Text

```bash
# Test alignment with text endpoint
curl -X POST http://localhost:8000/align/text \
  -H "Content-Type: application/json" \
  -d '{
    "english_text": "The boy lived with his aunt and uncle.",
    "german_text": "Der Junge lebte bei seiner Tante und seinem Onkel."
  }'
```

## Troubleshooting Tests

### Test Fails: "No response from server"

**Solution**: Make sure the Python alignment service is running:
```bash
cd aligner
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Test Fails: Input files not found

**Solution**: Verify files are in the `data/` directory:
```bash
ls -lh data/
# Should show: english.epub (or .pdf) and german.pdf (or .epub)
```

### Alignment Returns Too Few Segments

**Current Behavior**: The fallback paragraph alignment splits text by double newlines (`\n\n`). If your input files don't have clear paragraph breaks, you may get very few segments.

**Solutions**:
1. **Install a-studio** for better alignment (see main README)
2. **Pre-process your texts** to have clear paragraph breaks
3. **Use different input files** with better structure

### OpenAI API Errors

**Rate Limit Exceeded**:
- Add delays between API calls in `index.js`
- Use a higher-tier API key
- Process smaller batches

**Invalid API Key**:
- Verify your API key in `.env`
- Check for leading/trailing spaces
- Ensure the key starts with `sk-`

**Model Not Available**:
- Try `gpt-3.5-turbo` instead of `gpt-4` in `.env`
- Check your OpenAI account has access to the model

## Checking Test Results

### Verify Alignment Output

After running `npm test`, check:
- Number of segments should be reasonable (not just 1 for large books)
- English and German text pairs should be related
- Alignment method is shown in the output

### Verify Full Pipeline Output

After running `npm start`, check the `output/` directory:
```bash
ls -lh output/
# Should show: level_1.pdf through level_7.pdf
```

Open the PDFs to verify:
- **Level 1**: Mostly English with ~5% German words
- **Level 4**: Roughly 50/50 mix
- **Level 7**: Pure German (should match the German input)

## Performance Expectations

### Alignment Service
- Small texts (< 10 pages): < 1 second
- Medium texts (50-100 pages): 5-10 seconds
- Large texts (500+ pages): 30-60 seconds

### Full Pipeline (with OpenAI)
- 100 segments × 6 levels = 600 API calls
- At ~2 seconds per call = ~20 minutes
- Cost: ~$5-20 depending on model and text length

## Continuous Integration

For CI/CD pipelines, you can run the alignment test:

```bash
# Start service in background
cd aligner && uvicorn app:app --port 8000 &
sleep 5

# Run test
cd node && npm test

# Clean up
pkill -f uvicorn
```

## Next Steps

Once basic tests pass:
1. ✅ Verify alignment quality with your specific texts
2. ✅ Adjust the simple paragraph aligner if needed
3. ✅ Consider installing a-studio for better alignment
4. ✅ Test with actual OpenAI API (start with small samples!)
5. ✅ Review generated PDFs for quality

---

**Happy Testing! 🧪**
