// Test PDF parsing - CommonJS module
const fs = require('fs');
const path = require('path');

const pdfs = [
  { name: 'example_blood_test_report.pdf', path: '/home/user/workspace/example_blood_test_report.pdf' },
  { name: 'medical-lab-report-format-pdf-3.pdf', path: '/home/user/workspace/medical-lab-report-format-pdf-3.pdf' },
  { name: 'sterling-accuris-pathology-sample-report-unlocked.pdf', path: '/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf' },
];

async function parsePdfBuffer(buffer) {
  let mod;
  try {
    mod = require('pdf-parse');
  } catch (e) {
    throw new Error('Cannot require pdf-parse: ' + e.message);
  }
  
  console.log('  pdf-parse API keys:', Object.keys(mod).slice(0, 8).join(', '));
  
  // v2 API: class-based
  if (mod.PDFParse) {
    const { PDFParse } = mod;
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  
  // v1 API: function-based
  const fn = typeof mod === 'function' ? mod : mod.default;
  if (typeof fn === 'function') {
    const result = await fn(buffer);
    return result.text;
  }
  
  throw new Error('Unknown pdf-parse API. Keys: ' + Object.keys(mod).join(', '));
}

async function main() {
  for (const { name, p } of pdfs.map(x => ({ name: x.name, p: x.path }))) {
    console.log('\n' + '='.repeat(60));
    console.log('Testing:', name);
    console.log('='.repeat(60));
    
    try {
      const buffer = fs.readFileSync(p);
      const text = await parsePdfBuffer(buffer);
      console.log('✓ Parsed successfully, text length:', text.length);
      // Show first 300 chars
      const preview = text.substring(0, 300).replace(/\n/g, '↵');
      console.log('Preview:', preview);
    } catch (e) {
      console.error('✗ FAILED:', e.message);
    }
  }
}

main().catch(console.error);
