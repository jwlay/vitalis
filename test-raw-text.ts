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
  
  // Show full text with visible newlines and tabs
  const visible = text
    .replace(/\t/g, '[TAB]')
    .replace(/\n/g, '[NL]\n');
  
  // Show sections with glucose, hba1c, ldl, platelets
  const lines = text.split('\n');
  const keywords = ['glucose', 'hba1c', 'a1c', 'ldl', 'platelet', 'wbc', 'cholesterol', 'hemoglobin', 'insulin'];
  
  console.log('=== Lines matching key biomarkers ===');
  for (const line of lines) {
    const low = line.toLowerCase();
    if (keywords.some(k => low.includes(k))) {
      // Show with tabs visible
      console.log(JSON.stringify(line));
    }
  }
}

main().catch(console.error);
