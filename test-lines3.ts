import { readFileSync } from 'fs';
import { createRequire } from 'module';
const req = createRequire(import.meta.url);
const pdfParse = req('pdf-parse');

async function main() {
  const buffer = readFileSync('/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf');
  const parser = new pdfParse.PDFParse({ data: buffer });
  const result = await parser.getText();
  const lines = result.text.split('\n');
  
  // Show lines 410-425 (SGPT/SGOT area)
  console.log('=== Lines 410-430 ===');
  for (let i = 410; i < 430; i++) {
    console.log(i + ': ' + JSON.stringify(lines[i]));
  }
  
  // Show lines 130-140 (glucose/blood sugar area)
  console.log('\n=== Lines 128-145 ===');
  for (let i = 128; i < 145; i++) {
    console.log(i + ': ' + JSON.stringify(lines[i]));
  }
}

main().catch(console.error);
