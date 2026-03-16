// Test biomarker extraction from PDFs
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const pdfs = [
  { name: 'example_blood_test_report.pdf', path: '/home/user/workspace/example_blood_test_report.pdf' },
  { name: 'medical-lab-report-format-pdf-3.pdf', path: '/home/user/workspace/medical-lab-report-format-pdf-3.pdf' },
  { name: 'sterling-accuris-pathology-sample-report-unlocked.pdf', path: '/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf' },
];

// Import compiled version - need to compile first via tsx
// For now, test via transpile-on-the-fly using tsx
import { parsePdfText } from './server/biomarkers.ts';

async function parsePdfBuffer(buffer) {
  const mod = require('pdf-parse');
  const { PDFParse } = mod;
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

for (const { name, path } of pdfs) {
  console.log('\n' + '='.repeat(60));
  console.log('Testing:', name);
  console.log('='.repeat(60));
  
  try {
    const buffer = readFileSync(path);
    const text = await parsePdfBuffer(buffer);
    const biomarkers = parsePdfText(text);
    console.log(`✓ Found ${biomarkers.length} biomarkers:`);
    for (const b of biomarkers) {
      console.log(`  ${b.biomarkerKey}: ${b.originalValue} ${b.originalUnit}`);
    }
    if (biomarkers.length === 0) {
      console.log('  ⚠ No biomarkers found! Raw text sample:');
      console.log(text.substring(0, 800));
    }
  } catch (e) {
    console.error('✗ FAILED:', e.message);
  }
}
