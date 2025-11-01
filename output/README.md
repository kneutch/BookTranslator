# Output Directory

Generated PDF files will be placed here.

After running the translation pipeline (`npm start` in the `node/` directory), you will find:

- `level_1.pdf` - ~5% German (vocabulary seed)
- `level_2.pdf` - ~10% German (mixed lexicon)  
- `level_3.pdf` - ~20% German (syntax drift)
- `level_4.pdf` - ~50% German (structural balance)
- `level_5.pdf` - ~75% German (dominant L2)
- `level_6.pdf` - ~93% German (minimal scaffold)
- `level_7.pdf` - 100% German (original translation)

## File Details

Each PDF includes:
- Title page with level information
- Target L2 ratio
- Formatted hybrid text content
- Proper pagination

## Notes

- Files are regenerated on each run
- Large books may produce large PDFs
- Review Level 1 first to verify alignment quality
