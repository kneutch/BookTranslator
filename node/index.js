import 'dotenv/config';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { OpenAI } from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Configuration
const ALIGNER_URL = process.env.ALIGNER_URL || 'http://localhost:8000/align/files';
const MODEL = process.env.OPENAI_MODEL || 'gpt-4';

// Paths (relative to project root)
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SPEC_PATH = path.join(PROJECT_ROOT, 'spec.json');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'output');

// Check for input files (support both PDF and EPUB)
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
let EN_FILE, DE_FILE;

// Check for EPUB files first, then PDF
const possibleExtensions = ['.epub', '.pdf'];
const possibleEnglishFiles = ['english.epub', 'english.pdf'];
const possibleGermanFiles = ['german.epub', 'german.pdf'];

for (const file of possibleEnglishFiles) {
  const filePath = path.join(DATA_DIR, file);
  try {
    await fs.access(filePath);
    EN_FILE = filePath;
    break;
  } catch {}
}

for (const file of possibleGermanFiles) {
  const filePath = path.join(DATA_DIR, file);
  try {
    await fs.access(filePath);
    DE_FILE = filePath;
    break;
  } catch {}
}

if (!EN_FILE || !DE_FILE) {
  console.error('❌ Error: Could not find input files in data/ directory');
  console.error('   Please add either:');
  console.error('   - english.pdf and german.pdf, or');
  console.error('   - english.epub and german.epub');
  process.exit(1);
}

console.log('📚 Book Translator - Starting...');
console.log(`Model: ${MODEL}`);
console.log(`Aligner: ${ALIGNER_URL}`);
console.log(`English file: ${EN_FILE}`);
console.log(`German file: ${DE_FILE}`);

// Load specification
const SPEC = JSON.parse(await fs.readFile(SPEC_PATH, 'utf8'));
console.log('✅ Loaded translation specification');

// Data structures for tracking vocabulary across levels
const levelBuffers = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: []
};

// Track German words introduced (for glossing)
const seenGerman = new Set();

/**
 * Build a prompt for OpenAI to generate hybrid text at a specific level
 */
function buildPrompt({ level, spec, en, de, alignment, seenGermanArr }) {
  const levelSpec = spec.levels.find(l => l.level === level);
  
  return [
    {
      role: "system",
      content: `You are a language learning text generator. You create hybrid English-German texts that gradually introduce German vocabulary and grammar according to specific level rules. 

Your task is to transform English text into a hybrid version by selectively replacing English words/phrases with German equivalents based on the level's target L2 ratio and rules.

CRITICAL RULES:
1. ONLY replace words when their German equivalent appears in the SOURCE_DE alignment
2. Preserve the overall meaning and narrative flow
3. Maintain paragraph breaks and punctuation exactly
4. For levels 1-2, gloss new German words on FIRST use only: Wort (word)
5. Follow the level's target L2 ratio (±5%)
6. Respect the level's syntactic structure rules
7. Output ONLY the hybrid text, no explanations or meta-commentary`
    },
    {
      role: "user",
      content: `LEVEL: ${level}
NAME: ${levelSpec.name}
TARGET_L2_RATIO: ${levelSpec.target_L2_ratio}
STRUCTURE: ${levelSpec.structure}

GLOBAL_RULES:
${JSON.stringify(spec.global_rules, null, 2)}

LEVEL_RULES:
${JSON.stringify(levelSpec.rules, null, 2)}

SOURCE_EN:
${en}

SOURCE_DE (aligned translation):
${de}

ALIGNMENT INFO:
${JSON.stringify(alignment, null, 2)}

ALREADY_INTRODUCED_GERMAN (do not gloss these):
${JSON.stringify(seenGermanArr)}

TASK:
Transform the SOURCE_EN into a hybrid English-German text following the level rules above.
- Replace approximately ${Math.round(levelSpec.target_L2_ratio * 100)}% of content words with German
- Use ONLY German words that appear in SOURCE_DE
- For new German words (not in ALREADY_INTRODUCED_GERMAN) at levels 1-2, add gloss: Wort (word)
- Maintain natural readability
- Preserve paragraph structure

Output the hybrid text only, no other commentary:`
    }
  ];
}

/**
 * Extract German tokens from a hybrid text line (simple heuristic)
 */
function extractGermanTokens(line) {
  const words = line.split(/\s+/);
  const germanWords = [];
  
  for (const word of words) {
    // Remove punctuation
    const bare = word.replace(/[.,!?;:()"'«»]/g, '');
    
    // Heuristic: German nouns start with capital letter (not sentence start)
    // or contain German characters (ä, ö, ü, ß)
    if (bare.length > 0 && (
      /[äöüßÄÖÜ]/.test(bare) || 
      (/^[A-ZÄÖÜ][a-zäöüß]+$/.test(bare) && word !== words[0])
    )) {
      germanWords.push(bare);
    }
  }
  
  return germanWords;
}

/**
 * Call OpenAI API to generate hybrid text for one segment at one level
 */
async function generateHybridText({ level, en, de, alignment, spec }) {
  const prompt = buildPrompt({
    level,
    spec: spec.spectrum_translation_spec,
    en,
    de,
    alignment,
    seenGermanArr: Array.from(seenGerman)
  });

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: prompt,
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 2000
    });

    const hybridText = response.choices[0].message.content.trim();
    return hybridText;
  } catch (error) {
    console.error(`Error generating hybrid text for level ${level}:`, error.message);
    // Fallback: return original text
    return level === 7 ? de : en;
  }
}

/**
 * Write a level's accumulated text to a PDF file
 */
async function writePdf(level, lines) {
  const outPath = path.join(OUTPUT_DIR, `level_${level}.pdf`);
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      
      const stream = createWriteStream(outPath);
      doc.pipe(stream);
      
      // Title page
      doc.fontSize(20).text(`Level ${level}`, { align: 'center' });
      const levelSpec = SPEC.spectrum_translation_spec.levels.find(l => l.level === level);
      doc.fontSize(14).text(levelSpec.name, { align: 'center' });
      doc.fontSize(10).text(`Target L2 Ratio: ${levelSpec.target_L2_ratio * 100}%`, { align: 'center' });
      doc.moveDown(2);
      
      // Content
      doc.fontSize(11);
      
      for (const line of lines) {
        if (!line.trim()) {
          doc.moveDown(0.5);
          continue;
        }
        
        // Add the text
        doc.text(line, {
          align: 'left',
          lineGap: 2
        });
        
        doc.moveDown(0.3);
        
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }
      }
      
      doc.end();
      
      stream.on('finish', () => {
        console.log(`✅ Written: ${outPath}`);
        resolve();
      });
      
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Call Python alignment service
    console.log('\n📡 Calling alignment service...');
    const { data: aligned } = await axios.post(ALIGNER_URL, {
      english_file_path: EN_FILE,
      german_file_path: DE_FILE
    });
    
    const segments = aligned.segments;
    console.log(`✅ Received ${segments.length} aligned segments`);
    
    if (segments.length === 0) {
      throw new Error('No segments returned from alignment service');
    }
    
    // Step 2: Process each segment through all levels
    console.log('\n🔄 Generating hybrid texts...');
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const en = seg.en || '';
      const de = seg.de || '';
      
      if (!en.trim() && !de.trim()) {
        console.log(`⏭️  Skipping empty segment ${i + 1}`);
        continue;
      }
      
      console.log(`\nProcessing segment ${i + 1}/${segments.length}...`);
      
      // Level 7 is always pure German
      levelBuffers[7].push(de);
      
      // Generate levels 1-6 via OpenAI
      for (let level = 1; level <= 6; level++) {
        console.log(`  Level ${level}...`);
        
        const hybrid = await generateHybridText({
          level,
          en,
          de,
          alignment: seg.alignment || {},
          spec: SPEC
        });
        
        levelBuffers[level].push(hybrid);
        
        // Update vocabulary tracking
        const newGermanWords = extractGermanTokens(hybrid);
        newGermanWords.forEach(w => seenGerman.add(w));
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Step 3: Write all level PDFs
    console.log('\n📄 Writing PDF files...');
    
    for (let level = 1; level <= 7; level++) {
      if (levelBuffers[level].length === 0) {
        console.warn(`⚠️  No content for level ${level}`);
        continue;
      }
      
      await writePdf(level, levelBuffers[level]);
    }
    
    console.log('\n✨ All done!');
    console.log(`Generated ${Object.keys(levelBuffers).length} PDF files in ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the main function
main();
