import { readFileSync } from 'fs';
import { createRequire } from 'module';
const req = createRequire(import.meta.url);
const pdfParse = req('pdf-parse');

async function main() {
  const buffer = readFileSync('/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf');
  const parser = new pdfParse.PDFParse({ data: buffer });
  const result = await parser.getText();
  const lines = result.text.split('\n');
  
  // Show lines 78-120 (cholesterol area)
  console.log('=== Lines 78-120 ===');
  for (let i = 78; i < 125; i++) {
    console.log(i + ': ' + JSON.stringify(lines[i]));
  }
  
  // Show lines 155-172 (HbA1c area)
  console.log('\n=== Lines 155-175 ===');
  for (let i = 155; i < 175; i++) {
    console.log(i + ': ' + JSON.stringify(lines[i]));
  }
  
  // Show lines 0-25 (beginning of WBC section)
  console.log('\n=== Lines 0-50 ===');
  for (let i = 0; i < 50; i++) {
    console.log(i + ': ' + JSON.stringify(lines[i]));
  }
}

main().catch(console.error);
