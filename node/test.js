#!/usr/bin/env node

/**
 * Test script to verify the alignment service is working
 * without requiring OpenAI API calls
 */

import axios from 'axios';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALIGNER_URL = 'http://localhost:8000/align/files';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

async function main() {
  console.log('🧪 Testing BookTranslator alignment service...\n');

  // Check for input files
  const englishFile = path.join(DATA_DIR, 'english.epub');
  const germanFile = path.join(DATA_DIR, 'german.pdf');

  try {
    await fs.access(englishFile);
    console.log('✅ Found english.epub');
  } catch {
    console.error('❌ english.epub not found in data/');
    process.exit(1);
  }

  try {
    await fs.access(germanFile);
    console.log('✅ Found german.pdf');
  } catch {
    console.error('❌ german.pdf not found in data/');
    process.exit(1);
  }

  console.log('\n📡 Calling alignment service...');
  
  try {
    const response = await axios.post(ALIGNER_URL, {
      english_file_path: englishFile,
      german_file_path: germanFile
    });

    const segments = response.data.segments;
    console.log(`✅ Alignment successful!`);
    console.log(`   Received ${segments.length} aligned segments\n`);

    // Show first few segments
    console.log('📝 Sample aligned segments:\n');
    for (let i = 0; i < Math.min(3, segments.length); i++) {
      const seg = segments[i];
      console.log(`Segment ${i + 1}:`);
      console.log(`  EN: ${seg.en.substring(0, 80)}${seg.en.length > 80 ? '...' : ''}`);
      console.log(`  DE: ${seg.de.substring(0, 80)}${seg.de.length > 80 ? '...' : ''}`);
      console.log('');
    }

    console.log('✨ Test passed! The alignment service is working correctly.');
    console.log('\n⚠️  Note: To run the full pipeline with OpenAI integration:');
    console.log('   1. Add your OpenAI API key to .env');
    console.log('   2. Run: npm start');
    
  } catch (error) {
    console.error('❌ Test failed!');
    if (error.response) {
      console.error('   Server error:', error.response.data);
    } else if (error.request) {
      console.error('   No response from server. Is the alignment service running?');
      console.error('   Start it with: cd aligner && uvicorn app:app --port 8000');
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

main();
