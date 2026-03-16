import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require2 = createRequire(import.meta.url);
const pdfParse = require2('pdf-parse');

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const mod = pdfParse;
  const { PDFParse } = mod;
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

async function main() {
  const buffer = readFileSync('/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf');
  const text = await parsePdfBuffer(buffer);
  const lines = text.split('\n');
  
  // Find HbA1c section - show 5 lines around it
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('hba1c') || lines[i].toLowerCase().includes('glycosylated hemo')) {
      console.log(`\n--- Context around line ${i} ---`);
      for (let j = Math.max(0, i-2); j < Math.min(lines.length, i+5); j++) {
        console.log(`${j}: ${JSON.stringify(lines[j])}`);
      }
    }
  }
  
  // Also check Direct LDL line
  console.log('\n--- LDL section ---');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('ldl') || lines[i].toLowerCase().includes('hdl cholesterol')) {
      for (let j = Math.max(0, i-1); j < Math.min(lines.length, i+4); j++) {
        console.log(`${j}: ${JSON.stringify(lines[j])}`);
      }
    }
  }
  
  // Check glucose line
  console.log('\n--- Glucose section ---');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('glucose') && !lines[i].toLowerCase().includes('hemoglobin') && !lines[i].toLowerCase().includes('dia')) {
      for (let j = Math.max(0, i-1); j < Math.min(lines.length, i+4); j++) {
        console.log(`${j}: ${JSON.stringify(lines[j])}`);
      }
    }
  }
}

main().catch(console.error);
