# Node.js Orchestrator

Node.js service that orchestrates the book translation pipeline: fetching aligned segments, generating hybrid texts via OpenAI, and producing PDF outputs.

## Setup

### 1. Install Node.js Dependencies

```bash
cd node
npm install
```

### 2. Configure Environment Variables

Make sure the `.env` file in the project root has your OpenAI API key:

```
OPENAI_API_KEY=your_actual_api_key_here
ALIGNER_URL=http://localhost:8000/align/pdfs
OPENAI_MODEL=gpt-4
```

### 3. Prepare Input PDFs

Place your source PDF files in the `data/` directory:
- `data/english.pdf` - English source text
- `data/german.pdf` - German translation (aligned)

## Running

Make sure the Python alignment service is running first:

```bash
# In the aligner directory
uvicorn app:app --port 8000
```

Then run the Node.js orchestrator:

```bash
cd node
npm start
```

Or use watch mode for development:

```bash
npm run dev
```

## How It Works

1. **Alignment**: Calls the Python service to align English and German PDFs
2. **Generation**: For each aligned segment, calls OpenAI to generate hybrid text at levels 1-6
3. **Vocabulary Tracking**: Maintains a set of introduced German words for glossing
4. **PDF Output**: Writes 7 PDF files (one per level) to `output/` directory

## Output

The script generates 7 PDF files in the `output/` directory:

- `level_1.pdf` - ~5% German (vocabulary seed)
- `level_2.pdf` - ~10% German (mixed lexicon)
- `level_3.pdf` - ~20% German (syntax drift)
- `level_4.pdf` - ~50% German (structural balance)
- `level_5.pdf` - ~75% German (dominant L2)
- `level_6.pdf` - ~93% German (minimal scaffold)
- `level_7.pdf` - 100% German (original translation)

## Customization

### Adjust Processing

Edit `index.js` to:
- Change batch sizes for large documents
- Modify PDF styling (fonts, margins, etc.)
- Add progress indicators
- Implement caching to resume interrupted runs

### Model Selection

Use a different OpenAI model by setting the environment variable:

```bash
export OPENAI_MODEL=gpt-4-turbo-preview
# or in .env file
```

## Troubleshooting

### API Rate Limits

If you hit OpenAI rate limits:
- Increase the delay between requests (line with `setTimeout`)
- Use a higher tier API key
- Implement batching with retry logic

### Memory Issues

For very large books:
- Process segments in batches
- Write intermediate results to disk
- Use streaming for PDF generation

### Alignment Quality

If hybrid texts don't make sense:
- Check that PDFs are properly aligned (same content)
- Verify the alignment service is returning good segments
- Adjust the prompts in `buildPrompt()` function
