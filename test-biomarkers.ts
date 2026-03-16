import { readFileSync } from 'fs';
import { parsePdfText } from './server/biomarkers';
import { createRequire } from 'module';

const require2 = createRequire(import.meta.url);
const pdfParse = require2('pdf-parse');

const pdfs = [
  { name: 'example_blood_test_report.pdf', path: '/home/user/workspace/example_blood_test_report.pdf' },
  { name: 'medical-lab-report-format-pdf-3.pdf', path: '/home/user/workspace/medical-lab-report-format-pdf-3.pdf' },
  { name: 'sterling-accuris.pdf', path: '/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf' },
];

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const mod = pdfParse;
  if (mod.PDFParse) {
    const { PDFParse } = mod;
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  }
  throw new Error('Unknown pdf-parse API. Keys: ' + Object.keys(mod).join(', '));
}

async function main() {
  for (const { name, path } of pdfs) {
    console.log('\n=== ' + name + ' ===');
    const buffer = readFileSync(path);
    const text = await parsePdfBuffer(buffer);
    const biomarkers = parsePdfText(text);
    if (biomarkers.length > 0) {
      console.log('Found ' + biomarkers.length + ' biomarkers:');
      biomarkers.forEach((b: any) => console.log('  ' + b.biomarkerKey + ': ' + b.originalValue + ' ' + b.originalUnit));
    } else {
      console.log('WARNING: 0 biomarkers extracted');
      console.log('Text sample:', text.substring(0, 800));
    }
  }
}

main().catch(console.error);
